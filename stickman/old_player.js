/*
    Copyright 2013 Karl Hobley and Jessica-Jane Fox

    This file is part of Rippy Shreddy.
*/

"use strict";

RippyShreddy.Player = (function() {
    function PlayerPart(durability, p1, p2, radius) {
        // IMMUTABLE
        this.durability = durability;
        this.originalP1 = p1;
        this.originalP2 = p2;
        this.radius = radius;

        // MUTABLE
        this.p1 = p1;
        this.p2 = p2;

        this.p1Bleeding = false;
        this.p2Bleeding = false;
        this.p1BleedTimer = 0;
        this.p2BleedTimer = 0;

        this.damage = 0;
        this.isFractured = false;
        this.force = vec2.create();
        this.lastHitPlayer = null;

        this.age = 0;

        Object.seal(this);
    }

    PlayerPart.prototype.spawnSmokeParticleType = new RippyShreddy.particles.ParticleType(new RippyShreddy.physics.PhysicsEntityClass(false, -0.05, false, 0), 1);
    PlayerPart.prototype.spawnStarParticleType = new RippyShreddy.particles.ParticleType(new RippyShreddy.physics.PhysicsEntityClass(false, -0.05, false, 0), 1);
    PlayerPart.prototype.bloodParticleType = new RippyShreddy.particles.ParticleType(new RippyShreddy.physics.PhysicsEntityClass(false, 0.5, true, 0), 2);

    PlayerPart.prototype.spawnSmokeParticleType.image = new Image;
    PlayerPart.prototype.spawnSmokeParticleType.image.src = "/static/game/media/particles/spawn-smoke.png";

    PlayerPart.prototype.spawnStarParticleType.image = new Image;
    PlayerPart.prototype.spawnStarParticleType.image.src = "/static/game/media/particles/spawn-star.png";

    PlayerPart.prototype.bloodParticleType.image = new Image;
    PlayerPart.prototype.bloodParticleType.image.src = "/static/game/media/particles/blood.png";


    PlayerPart.prototype.addDamage = function(damage) {
        // Add damage
        this.damage += damage;
    };

    PlayerPart.prototype.shouldFracture = function() {
        // Check if fractured
        if (this.damage > this.durability) {
            return true;
        }

        return false;
    }

    PlayerPart.prototype.heal = function() {
        // Reset health
        this.damage = 0;
        this.isFractured = false;

        // Set p1 and p2 back to original values
        this.p1 = this.originalP1;
        this.p2 = this.originalP2;

        // Stop bleeding
        this.p1Bleeding = false;
        this.p2Bleeding = false;
        this.p1BleedTimer = 0;
        this.p2BleedTimer = 0;

        // Reset force
        this.force[0] = 0;
        this.force[1] = 0;

        // Reset age
        this.age = 0;
    };

    PlayerPart.prototype.needsToHeal = function() {
        // Return true if fractured or if any damage has been done
        return this.isFractured || this.damage > 0;
    };

    PlayerPart.prototype.createSmoke = function(scene, amount) {
        // Smoke effect
        var diffX = this.p2[0] - this.p1[0];
        var diffY = this.p2[1] - this.p1[1];
        var length = Math.sqrt(diffX * diffX + diffY * diffY);

        // Create particles
        this.spawnSmokeParticleType.createMultipleOnLine(scene, (length * amount) / 200 , this.p1, this.p2, 10, 0, Math.PI * 2, 0, 150);
        this.spawnStarParticleType.createMultipleOnLine(scene, (length * amount) / 200 , this.p1, this.p2, 10, 0, Math.PI * 2, 0, 150);
    };

    PlayerPart.prototype.lineCollision = function(collisionLine) {
        // Check if the part is fractured
        if (this.isFractured) {
            return;
        }

        // Handler
        var onHit = function(scene, collision, projectile) {
            if (collision.data.part) {
                collision.data.part.onHit(scene, collision, projectile);
            }
        };

        // Collide
        collisionLine.lineIntersection(this.p1, this.p2, {part: this, onHit: onHit});
    };

    PlayerPart.prototype.onHit = function(scene, collision, projectile) {
        // Create blood splatter
        var projectileDirection = Math.atan2(projectile.velocity[0], projectile.velocity[1]);
        this.bloodParticleType.createMultiple(scene, 20, collision.position, collision.position, projectileDirection - 0.3, projectileDirection + 0.3, 100, 1500);

        // Add force
        var projectileDirectionUV = vec2.normalize(vec2.create(), projectile.velocity);
        this.force[0] = projectile.projectileType.force * projectileDirectionUV[0];
        this.force[1] = projectile.projectileType.force * projectileDirectionUV[1];

        // Add damage
        this.damage += projectile.projectileType.damage;

        // Store last hit player
        this.lastHitPlayer = projectile.player;
    };

    PlayerPart.prototype.update = function(scene, dt) {
        // Recover damage over time
        this.damage -= 25 * dt;

        // Check that damage is not too low
        if (this.damage < 0) {
            this.damage = 0;
        }

        // Check if this is the first update
        if (this.age == 0) {
            // Make smoke
            this.createSmoke(scene, 10);
        } else if (this.age < 0.5) {
            // Make more smoke
            this.createSmoke(scene, this.age + 0.5);
        }

        // Increase age
        this.age += dt;

        // Bleeding
        if (this.p1Bleeding || this.p2Bleeding) {
            // Calculate limb direction
            var diffX = this.p1[0] - this.p2[0];
            var diffY = this.p1[1] - this.p2[1];
            var limbDirection = Math.atan2(diffX, diffY);

            // P1
            if (this.p1Bleeding) {
                // Work out amount of blood to create
                var p1BloodAmount = 100 * (1 - this.p1BleedTimer / 3);
                if (p1BloodAmount < 10) {
                    p1BloodAmount = 10;
                }

                // Create blood
                this.bloodParticleType.createMultiple(scene, p1BloodAmount * dt, this.p1, this.p1, limbDirection - 0.3, limbDirection + 0.3, p1BloodAmount * 10, p1BloodAmount * 10);

                // Increase p1 bleed timer
                this.p1BleedTimer = this.p1BleedTimer + dt;
            }

            // P2
            if (this.p2Bleeding) {
                // Work out amount of blood to create
                var p2BloodAmount = 100 * (1 - this.p2BleedTimer / 3);
                if (p2BloodAmount < 10) {
                    p2BloodAmount = 10;
                }

                // Create blood
                this.bloodParticleType.createMultiple(scene, p2BloodAmount * dt, this.p2, this.p2, limbDirection + Math.pi - 0.3, limbDirection + Math.pi + 0.3, p2BloodAmount * 10, p2BloodAmount * 10);

                // Increase p2 bleed timer
                this.p2BleedTimer = this.p2BleedTimer + dt;
            }
        }
    };

    PlayerPart.prototype.draw = function(context) {
        if (this.radius > 0) {
            context.arc(this.p1[0], this.p1[1], 30, 0, Math.PI * 2);
        } else {
            context.moveTo(this.p1[0], this.p1[1]);
            context.lineTo(this.p2[0], this.p2[1]);
        }
    };

    Object.freeze(PlayerPart.prototype);



    function PlayerFragmentPoint(xLocal, yLocal) {
        this.xLocal = xLocal;
        this.yLocal = yLocal;
        this.v = vec2.create();

        Object.seal(this);
    }

    Object.freeze(PlayerFragmentPoint.prototype);

    function PlayerFragment() {
        this.physicsEntity = null;

        this.parts = new Array();
        this.points = new Array();

        this.deleted = false;

        Object.seal(this);
    }

    PlayerFragment.prototype.physicsEntityClass = new RippyShreddy.physics.PhysicsEntityClass(false, 1, 0, 0);

    PlayerFragment.prototype.complete = function(scene) {
        // Get average X and Y
        var averageX = 0;
        var averageY = 0;
        var partCount = this.parts.length;
        for (var partID = 0; partID < partCount; partID++) {
            var partObj = this.parts[partID];
            averageX += (partObj.p1[0] + partObj.p2[0]) / 2;
            averageY += (partObj.p1[1] + partObj.p2[1]) / 2;
        }
        averageX /= partCount;
        averageY /= partCount;

        // Create physics entity
        this.physicsEntity = new RippyShreddy.physics.PhysicsEntity(scene.map, this.physicsEntityClass, vec2.set(vec2.create(), averageX, averageY));
        this.physicsEntity.angularVelocity = Math.PI * 2 * Math.random() - Math.PI;

        // Take away position from fragment positions and store them in new vectors
        for (var partID = 0; partID < partCount; partID++) {
            var partObj = this.parts[partID];

            var p1Point = new PlayerFragmentPoint(partObj.p1[0] - averageX, partObj.p1[1] - averageY);
            var p2Point = new PlayerFragmentPoint(partObj.p2[0] - averageX, partObj.p2[1] - averageY);

            this.points.push(p1Point);
            this.points.push(p2Point);

            partObj.p1 = p1Point.v;
            partObj.p2 = p2Point.v;
        }
    }

    PlayerFragment.prototype.update = function(scene, dt) {
        // Check that the fragment is not deleted
        if (this.deleted) {
            return;
        }

        // If no physics entity, dont update
        if (!this.physicsEntity) {
            return;
        }

        // Update physics entity
        this.physicsEntity.update(dt);

        // Check height
        if (this.physicsEntity.position[1] > 12000) {
            this.deleted = true;
        }

        // Update points
        for (var pointID in this.points) {
            var point = this.points[pointID];

            // Get local positions
            var xLocal = point.xLocal;
            var yLocal = point.yLocal;

            // Rotate local positions
            var angle = this.physicsEntity.angle;
            var a = Math.sin(angle);
            var b = Math.cos(angle);

            var xLocalOld = xLocal;
            xLocal = xLocal * b - yLocal * a;
            yLocal = xLocalOld * a + yLocal * b;

            // Add local positions to physics entity position
            point.v[0] = xLocal + this.physicsEntity.position[0];
            point.v[1] = yLocal + this.physicsEntity.position[1];
        }

        // Update parts
        for (var partID in this.parts) {
            var part = this.parts[partID];
            part.update(scene, dt);
        }



    }

    PlayerFragment.prototype.draw = function(context, camera) {
        // Save context
        context.save();

        // Begin path
        context.beginPath();

        // Line settings
        context.lineJoin = "round";
        context.lineCap = "round";
        context.lineWidth = 10;

        // Loop through line parts
        for (var partID in this.parts) {
            var partObj = this.parts[partID];
            if (partObj.radius == 0) {
                partObj.draw(context);
            }
        }

        // Draw
        context.stroke();

        // Begin path
        context.beginPath();

        // Loop through solid parts
        for (var partID in this.parts) {
            var partObj = this.parts[partID];
            if (partObj.radius > 0) {
                partObj.draw(context);
            }
        }

        // Draw
        context.fill();

        // Restore context
        context.restore();
    }

    Object.freeze(PlayerFragment.prototype);



    function Player(scene, name) {
        this.scene = scene;
        this.name = name;

        this.kills = 0;
        this.assists = 0;
        this.score = 0;

        this.deathsByEnemy = 0;
        this.deathsByAccident = 0;

        this.isAI = false;
        this.lastThinkTimer = 0;

        this.respawnTimer = 0;
        this.isDead = false;
        this.inGame = false;

        // Settings
        this.standNeckHeight = 100;
        this.duckNeckHeight = 75;
        this.standHipHeight = 75;
        this.duckHipHeight = 50;
        this.legHeight = 40;
        this.legAnimSpeed = 15;
        this.moveSpeed = 450;

        // Inputs
        this.move = 0;
        this.isRunning = false;
        this.isDucking = false;
        this.isJumping = false;
        this.isShooting = false;
        this.isHealing = false;
        this.isDroppingWeapon = false;
        this.weapon = null;

        this.target = null;

        // Outputs
        this.movePhase = 0;
        this.legDirection = 0;
        this.duckTransition = 0;
        this.neckHeight = 0;
        this.hipHeight = 0;
        this.breathePhase = Math.random() * Math.PI;
        this.previousVelocity = vec2.create();
        this.origin = vec2.create();
        this.targetPoint  = vec2.create();
        this.deathAccidental = false;
        this.leftHandPosition = vec2.create();
        this.rightHandPosition = vec2.create();
        this.facingLeft = false;
        this.pitch = 0;
        this.sparePartsBoxes = 0;
        this.insideWeaponDrop = null;
        this.hasDroppedWeapon = false;

        // Skeleton
        this.skeleton = {
            hipPosition: vec2.create(),
            neckPosition: vec2.create(),
            middlePosition: vec2.create(),
            headPosition: vec2.create(),
            leftFootPosition: vec2.create(),
            rightFootPosition: vec2.create(),
            leftKneePosition: vec2.create(),
            rightKneePosition: vec2.create(),
            leftElbowPosition: vec2.create(),
            rightElbowPosition: vec2.create(),
            leftHandPosition: vec2.create(),
            rightHandPosition: vec2.create(),
        };

        // Physics entity
        this.physicsEntity = null;

        // Create parts
       this.parts = {
            head: new PlayerPart(200, this.skeleton.headPosition, this.skeleton.neckPosition, 30),
            upperBody: new PlayerPart(200, this.skeleton.neckPosition, this.skeleton.middlePosition, 0),
            lowerBody: new PlayerPart(200, this.skeleton.middlePosition, this.skeleton.hipPosition, 0),
            upperLeftLeg: new PlayerPart(100, this.skeleton.hipPosition, this.skeleton.leftKneePosition, 0),
            lowerLeftLeg: new PlayerPart(100, this.skeleton.leftKneePosition, this.skeleton.leftFootPosition, 0),
            upperRightLeg: new PlayerPart(100, this.skeleton.hipPosition, this.skeleton.rightKneePosition, 0),
            lowerRightLeg: new PlayerPart(100, this.skeleton.rightKneePosition, this.skeleton.rightFootPosition, 0),
            upperLeftArm: new PlayerPart(100, this.skeleton.neckPosition, this.skeleton.leftElbowPosition, 0),
            lowerLeftArm: new PlayerPart(100, this.skeleton.leftElbowPosition, this.skeleton.leftHandPosition, 0),
            upperRightArm: new PlayerPart(100, this.skeleton.neckPosition, this.skeleton.rightElbowPosition, 0),
            lowerRightArm: new PlayerPart(100, this.skeleton.rightElbowPosition, this.skeleton.rightHandPosition, 0),
        };

        this.fragments = new Array();

        Object.seal(this);
    }

    Player.prototype.physicsEntityClass = new RippyShreddy.physics.PhysicsEntityClass(true, 1, 0, 0);


    Player.prototype.spawn = function(position) {
        // Physics entity
        this.physicsEntity = new RippyShreddy.physics.PhysicsEntity(this.scene, this.physicsEntityClass, position);

        // Reset parts
        this.heal(true);

        // Set random weapon
        this.setRandomWeapon();

        // Not dead
        this.isDead = false;

        // In game
        this.inGame = true;
    };

    Player.prototype.heal = function(healAll) {
        // Loop through parts and reset them
        for (var part in this.parts) {
            if (healAll == true || this.parts[part].needsToHeal()) {
                this.parts[part].heal();
            }

            // Make sure this part is not bleeding regardless of whether the part needs healing
            this.parts[part].p1Bleeding = false;
            this.parts[part].p2Bleeding = false;
        }

        // Delete fragments
        this.fragments = new Array();

        // Update bounding box
        this.updateBoundingBox();
    };

    Player.prototype.needsToHeal = function() {
        // Loop through parts
        for (var part in this.parts) {
            if (this.parts[part].needsToHeal()) {
                return true;
            }
        }

        // No parts need healing
        return false;
    };

    Player.prototype.die = function() {
        // Create fragments
        if (!this.parts.upperBody.isFractured) {
            this.fracture("upperBody", null, null);
        }
        if (!this.parts.lowerBody.isFractured) {
            this.fracture("lowerBody", null, null);
        }

        // Set isDead
        this.isDead = true;

        // Drop weapon
        if (this.weapon) {
            this.dropWeapon();
        }

        // Increase death count
        if (this.deathAccidental) {
            this.deathsByAccident++;
        } else {
            this.deathsByEnemy++;
        }
    };

    Player.prototype.updateBleeding = function() {
        // If head is fractured but upperbody isn't, make both bleed
        if (this.parts.head.isFractured && !this.parts.upperBody.isFractured) {
            this.parts.head.p2Bleeding = true
            this.parts.upperBody.p1Bleeding = true
        }

        // If upperBody is fractured but lowerbody isn't, make moth bleed
        if (this.parts.upperBody.isFractured && !this.parts.lowerBody.isFractured) {
            this.parts.lowerBody.p1Bleeding = true
            this.parts.upperBody.p2Bleeding = true
        }

        // ... and vice versa
        if (this.parts.lowerBody.isFractured && !this.parts.upperBody.isFractured) {
            this.parts.lowerBody.p1Bleeding = true
            this.parts.upperBody.p2Bleeding = true
        }

        // If an arm is fractured but upperbody isn't make arm bleed
        if (this.parts.upperLeftArm.isFractured && !this.parts.upperBody.isFractured) {
            this.parts.upperLeftArm.p1Bleeding = true
        }
        if (this.parts.upperRightArm.isFractured && !this.parts.upperBody.isFractured) {
            this.parts.upperRightArm.p1Bleeding = true
        }

        // If a leg is fractured but lowerbody isn't make arm bleed
        if (this.parts.upperLeftLeg.isFractured && !this.parts.lowerBody.isFractured) {
            this.parts.upperLeftLeg.p1Bleeding = true
        }
        if (this.parts.upperRightLeg.isFractured && !this.parts.lowerBody.isFractured) {
            this.parts.upperRightLeg.p1Bleeding = true
        }
    };

    Player.prototype.fracture = function(partName, velocity, player) {
        // Create fragment
        var fragment = new PlayerFragment();

        // Remove the part
        this.removePart(partName, fragment);

        // Complete the fragment
        fragment.complete(this.scene);

        // Set the velocity
        if (velocity) {
            fragment.physicsEntity.velocityNext[0] += velocity[0];
            fragment.physicsEntity.velocityNext[1] += velocity[1];
        }

        // Insert fragment into fragments array
        this.fragments.push(fragment);

        // Update bleeding
        this.updateBleeding();

        // Check if player is dead
        if (this.parts.upperBody.isFractured && this.parts.lowerBody.isFractured) {
            // Kill the player
            this.die();
        }

        // Return fragment
        return fragment;
    };

    Player.prototype.explode = function(player) {
        // Make fragments
        if (!this.parts.upperLeftLeg.isFractured) {
            var velocity = vec2.set(vec2.create(),
                -(500 + 1000 * Math.random()),
                (500 + 1000 * Math.random())
            );
            this.fracture("lowerBody", velocity, player);
        }
        if (!this.parts.upperRightLeg.isFractured) {
            var velocity = vec2.set(vec2.create(),
                (500 + 1000 * Math.random()),
                (500 + 1000 * Math.random())
            );
            this.fracture("upperRightLeg", velocity, player);
        }
        if (!this.parts.lowerBody.isFractured) {
            var velocity = vec2.set(vec2.create(),
                (-250 + 500 * Math.random()),
                (500 + 1000 * Math.random())
            );
            this.fracture("lowerBody", velocity, player);
        }
        if (!this.parts.upperLeftArm.isFractured) {
            var velocity = vec2.set(vec2.create(),
                -(500 + 1000 * Math.random()),
                -(500 + 1000 * Math.random())
            );
            this.fracture("upperLeftArm", velocity, player);
        }
        if (!this.parts.upperRightArm.isFractured) {
            var velocity = vec2.set(vec2.create(),
                (500 + 1000 * Math.random()),
                -(500 + 1000 * Math.random())
            );
            this.fracture("upperRightArm", velocity, player);
        }
        if (!this.parts.upperBody.isFractured) {
            var velocity = vec2.set(vec2.create(),
                (-250 + 500 * Math.random()),
                -(500 + 1000 * Math.random())
            );
            this.fracture("upperBody", velocity, player);
        }

        // Kill the player
        this.die();
    };

    Player.prototype.lineCollision = function(collisionLine) {
        // Check that the player is alive
        if (!this.inGame) {
            return
        }

        // Collide each part
        for (var partID in this.parts) {
            var part = this.parts[partID];
            part.lineCollision(collisionLine);
        }
    };

    Player.prototype.updateBoundingBox = function() {
        // Save origin
        var oldOrigin = vec2.clone(this.origin);

        // Zero origin
        this.origin[0] = 0;
        this.origin[1] = 0;

        // Create bounding box
        var box = { top: 0, left: 0, right: 0, bottom: 0 };

        // Work out new origin and bounding box top
        if (!this.parts.lowerBody.isFractured) {
            box.top += this.standHipHeight;
            box.top += this.standNeckHeight / 2;
        } else {
            this.origin[1] += this.standHipHeight;
            this.origin[1] += this.standNeckHeight / 2;
        }
        if (!this.parts.upperBody.isFractured) {
            box.top += this.standNeckHeight / 2;
        }
        if (!this.parts.head.isFractured) {
            box.top += 70
        }

        // Set position to origin change
        var originChange = vec2.sub(vec2.create(), oldOrigin, this.origin);
        this.physicsEntity.positionNext[0] += originChange[0];
        this.physicsEntity.positionNext[1] += originChange[1];

        // Rest of bounding box
        box.bottom = 5;
        box.left = 25;
        box.right = 25;

        // Set box
        this.physicsEntity.box = box;
    };

    Player.prototype.removePart = function(part, fragment) {
        // Quit if already fractured
        if (this.parts[part].isFractured) {
            return;
        }

        // Add part to fragment
        if (fragment) {
            fragment.parts.push(this.parts[part]);
        }

        // Fracture this part
        this.parts[part].isFractured = true;

        // Remove parts which attach to this part
        if (part == "upperBody") { // If this is the body
            // Remove arms and head
            this.removePart("head", fragment);
            this.removePart("upperLeftArm", fragment);
            this.removePart("upperRightArm", fragment);
        } else if (part == "lowerBody") {
            // Remove legs
            this.removePart("upperLeftLeg", fragment);
            this.removePart("upperRightLeg", fragment);
        } else if (part == "upperLeftArm") { // If this is an arm
            this.removePart("lowerLeftArm", fragment);
        } else if (part == "upperRightArm") {
            this.removePart("lowerRightArm", fragment);
        } else if (part == "upperLeftLeg") { // If this is a leg
            this.removePart("lowerLeftLeg", fragment);
        } else if (part == "upperRightLeg") {
            this.removePart("lowerRightLeg", fragment);
        } else if (part == "lowerLeftLeg") {
            this.removePart("upperLeftLeg", fragment);
        } else if (part == "lowerRightLeg") {
            this.removePart("upperRightLeg", fragment);
        }

        // If no legs, remove lower body
        if ((part == "upperLeftLeg" && this.parts.upperRightLeg.isFractured) ||
            (part == "upperRightLeg" && this.parts.upperLeftLeg.isFractured)) {
            this.removePart("lowerBody", fragment);
        }

        // If no arms or head, remove upper body
        if ((part == "upperLeftArm" && this.parts.upperRightArm.isFractured && this.parts.head.isFractured) ||
            (part == "upperRightArm" && this.parts.upperLeftArm.isFractured && this.parts.head.isFractured) ||
            (part == "head" && this.parts.upperRightArm.isFractured && this.parts.upperLeftArm.isFractured)) {
            this.removePart("upperBody", fragment);
        }

        // If head, upper or lower body. Update bounding box
        if (part == "head" ||
            part == "upperBody" ||
            part == "lowerBody") {
            this.updateBoundingBox();
        }
    };

    Player.prototype.setWeapon = function(weapon) {
        // Set weapon
        this.weapon = weapon.create(this);
    };

    Player.prototype.getRandomWeapon = function() {
        var weapons = ["machinegun", "shotgun", "peacemaker", "bazooka", "bow", "sword"];
        return weapons[Math.floor(Math.random() * weapons.length)];
    }

    Player.prototype.setRandomWeapon = function() {
        // Set a random weapon
        this.setWeapon(RippyShreddy.weapons.types[this.getRandomWeapon()]);
    };

    Player.prototype.dropWeapon = function() {
        // Check that the player is holding a weapon
        if (this.weapon == null) {
            return;
        }

        // Create weapon drop
        this.scene.weaponDrops.push(new RippyShreddy.weapons.WeaponDrop(this.scene, this.weapon.weaponType, this.physicsEntity.position, this));

        // Remove weapon from player
        this.weapon = null;
    };

    Player.prototype.pickupDrop = function(drop) {
        // Set weapon
        this.setWeapon(drop.weaponType);

        // Delete the drop
        drop.deleted = true;
    };

    Player.prototype.update = function(dt) {
        // Check that this player is alive
        if (!this.inGame) {
            return
        }

        // If AI, think
        this.lastThinkTimer += dt;
        if (this.isAI && this.lastThinkTimer > 0.5) {
            this.think();
            this.lastThinkTimer = 0;
        }

        // PART FRACTURING
            for (var partID in this.parts) {
                var part = this.parts[partID];
                if (!part.isFractured && part.shouldFracture()) {
                    this.fracture(partID, part.forces, part.lastHitPlayer);
                }
            }

        // LEGS
            // Calculate leg count
            var legCount = 0;
            if (!this.parts.lowerLeftLeg.isFractured) {
                legCount++;
            }
            if (!this.parts.lowerRightLeg.isFractured) {
                legCount++;
            }

        // DUCKING
            // Add change in velocity to duck amount
            this.duckTransition += (this.previousVelocity[1] - this.physicsEntity.velocity[1]) / 2000;

            // Find duck speed
            var duckDistanceLeft = Math.abs((this.isDucking ? 1 : 0) - this.duckTransition);
            var duckSpeed = duckDistanceLeft * dt * 10;

            // Update duck transition
            if (this.isDucking && legCount > 0) {
                this.duckTransition += duckSpeed;
            } else {
                this.duckTransition -= duckSpeed;
            }

            // Update ducking
            if (this.duckTransition < 0) { // Ducking
                // Set duck transition
                this.duckTransition = 0;

                // Update neck and foot height
                this.neckHeight = this.standNeckHeight;
                this.hipHeight = this.standHipHeight;
            } else if (this.duckTransition > 1) { // Standing
                // Set duck transition
                this.duckTransition = 1;

                // Update neck and foot height
                this.neckHeight = this.duckNeckHeight;
                this.hipHeight = this.duckHipHeight;
            } else { // Transitioning
                // Update neck and foot height
                this.neckHeight = this.standNeckHeight + (this.duckNeckHeight - this.standNeckHeight) * this.duckTransition;
                this.hipHeight = this.standHipHeight + (this.duckHipHeight - this.standHipHeight) * this.duckTransition;
            }

        // BREATHING
            // Update breathe animation
            this.breathePhase += dt;
            this.neckHeight += Math.sin(this.breathePhase) * 5 / (1 + this.duckTransition);

        // MOVEMENT
            // Calculate target speed
            var targetSpeed = this.moveSpeed * this.move / (1 + this.duckTransition);

            // Leg count
            if (legCount == 0) {
                targetSpeed = 0
            } else if (legCount == 1) {
                targetSpeed *= 0.5;
            }

            var targetSpeedDiff = targetSpeed - this.physicsEntity.velocity[0];

            // Move player
            this.physicsEntity.velocityNext[0] += targetSpeedDiff;

            // Make player explode if he is too low (Y higher than 5000)
            if (this.physicsEntity.position[1] > 5000) {
                this.explode();
                this.deathAccidental = true;
            }

        // PREVIOUS VELOCITY
            // Save previous velocity
            this.previousVelocity[0] = this.physicsEntity.velocity[0];
            this.previousVelocity[1] = this.physicsEntity.velocity[1];

        // PHYSICS
            // Update physics entity
            this.physicsEntity.update(dt);

        // TARGET POINT
            // Update target point
            var totalX = 0, totalY = 0;
            var points = 0;
            for (var partID in this.parts) {
                var partObj = this.parts[partID];
                if (!partObj.isFractured) {
                    totalX += partObj.p1[0];
                    totalY += partObj.p1[1];
                    totalX += partObj.p2[0];
                    totalY += partObj.p2[1];
                    points += 2;
                }
            }
            this.targetPoint[0] = totalX / points;
            this.targetPoint[1] = totalY / points;

        // MOVING ANIMATION
            // Add move phase change
            if (this.physicsEntity.touching.bottom) {
                var legSpeed = this.physicsEntity.velocity[0] * dt / 30;
                if (this.move < 0) {
                    legSpeed *= -1;
                }
                this.movePhase += legSpeed;
            } else {
                this.movePhase = Math.PI / 8;
            }

            // Work out leg direction
            if (this.physicsEntity.velocity[0] > 0) {
                this.legDirection = 1;
            } else if (this.physicsEntity.velocity[0] < 0) {
                this.legDirection = -1;
            } else {
                this.legDirection = 0;
            }

        // JUMPING
            // Check that the player is jumping
            if (this.isJumping && this.physicsEntity.touching.bottom && legCount == 2) {
                // Add velocity
                this.physicsEntity.velocityNext[1] -= 1400;
            }

        // TARGETING
            // Update targeting
            if (this.target) {
                // TODO: USE NECK POSITION
                var positionX = this.physicsEntity.position[0] + this.origin[0], positionY = this.physicsEntity.position[1]  + this.origin[1] - this.neckHeight - this.hipHeight;
                var targetX = this.target[0], targetY = this.target[1];

                // Get difference between position and target
                var diffX = targetX - positionX;
                var diffY = targetY - positionY;

                // Direction
                this.facingLeft = diffX < 0;

                // Find the distance
                var distance = Math.sqrt(diffX * diffX + diffY * diffY);

                // Work out the muzzle height
                var muzzleHeight = 40;
                if (this.weapon) {
                    if (this.weapon.weaponType.muzzlePosition) {
                        muzzleHeight -= this.weapon.weaponType.muzzlePosition[1];
                    }
                }

                // Find the angle (40 is the how low the gun is held below the neck)
                this.pitch = Math.atan2(diffY, Math.abs(diffX)) - Math.asin(muzzleHeight / distance);

                // Prevent NaN
                if (!this.pitch) {
                    this.pitch = 0;
                }
            }

        // WEAPON
            // Update weapon
            if (this.weapon) {
                this.weapon.update(dt, this.isShooting, this.skeleton.neckPosition, this.facingLeft, this.pitch);
            }

        // HAND POSITIONS
            // Hand positions
            if (this.weapon) {
                if (this.weapon.leftHandPosition) {
                    this.leftHandPosition = vec2.clone(this.weapon.leftHandPosition);
                }
                if (this.weapon.rightHandPosition) {
                    this.rightHandPosition = vec2.clone(this.weapon.rightHandPosition);
                }
            } else {
                vec2.set(this.leftHandPosition, 30, 40);
                vec2.set(this.rightHandPosition, 30, 40);
            }

        // BUILD SKELETON
            this.buildSkeleton();

        // UPDATE PARTS
            for (var partID in this.parts) {
                var part = this.parts[partID];
                if (!part.isFractured) {
                    part.update(this.scene, dt);
                }
            }

        // CURRENT TILE
            // Work out current tile
            var currentTileX = Math.floor(this.physicsEntity.position[0] / 64);
            var currentTileY = Math.floor((this.physicsEntity.position[1] + this.physicsEntity.box.bottom - 32) / 64);

            // See if theres a spare parts box here
            // TODO: Speed this up
            // Loop through spare parts boxes
            var map = this.scene.map;
            for (var sparePartsBoxID in map.sparePartsBoxes) {
                if (this.sparePartsBoxes < 3 &&
                    map.sparePartsBoxes[sparePartsBoxID].position[0] == currentTileX &&
                    map.sparePartsBoxes[sparePartsBoxID].position[1] == currentTileY &&
                    map.sparePartsBoxes[sparePartsBoxID].canBePickedUp()) {

                    // Pickup spare parts box
                    map.sparePartsBoxes[sparePartsBoxID].pickup();

                    // Increase number of spare parts boxes the player has
                    this.sparePartsBoxes++;
                }
            }

        // WEAPON DROP
            // Calculate hand count
            var handCount = 0;
            if (!this.parts.lowerLeftArm.isFractured) {
                handCount++;
            }
            if (!this.parts.lowerRightArm.isFractured) {
                handCount++;
            }

            // Clear current weapon drop
            this.insideWeaponDrop = null;

            // Loop through weapon drops
            // TODO: Speed this up
            if (handCount != 0) {
                for (var weaponDropID in this.scene.weaponDrops) {
                    var weaponDropObj = this.scene.weaponDrops[weaponDropID];
                    if (!weaponDropObj.deleted) {
                        // Make sure that player has enough hands to hold weapon
                        if (handCount == 1 && weaponDropObj.weaponType.twoHanded) {
                            continue;
                        }

                        // Check if player is in weapon drop X
                        var left = weaponDropObj.physicsEntity.position[0] - weaponDropObj.physicsEntity.box.left;
                        var right = weaponDropObj.physicsEntity.position[0] + weaponDropObj.physicsEntity.box.right;
                        var thisX = this.physicsEntity.position[0];
                        if (thisX < left || thisX > right) {
                            continue;
                        }

                        // Check if player is in weapon drop Y
                        var top = weaponDropObj.physicsEntity.position[1] - weaponDropObj.physicsEntity.box.top;
                        var bottom = weaponDropObj.physicsEntity.position[1] + weaponDropObj.physicsEntity.box.bottom;
                        var thisY = this.physicsEntity.position[1];
                        if (thisY < top || thisY > bottom) {
                            continue;
                        }

                        // Player is inside weapon drop
                        this.insideWeaponDrop = weaponDropObj;

                        // If the player doesnt have a weapon, pick this one up automatically
                        if (this.weapon == null) {
                            if (!(weaponDropObj.droppedBy === this && weaponDropObj.age < 3)) {
                                this.pickupDrop(this.insideWeaponDrop);
                            }
                        }

                        // Finish loop
                        break;
                    }
                }
            }

            // If not enough hands, drop weapon
            if (handCount < 2 && this.weapon) {
                if (this.weapon.weaponType.twoHanded) {
                    this.dropWeapon();
                } else {
                    if (handCount == 0) {
                        this.dropWeapon();
                    }
                }
            }

        // HEALING
            if (this.isHealing) {
                // Check if the player has enough spare parts boxes and if the player needs to heal
                if (this.sparePartsBoxes > 0 && this.needsToHeal()) {
                    // Heal
                    this.heal(false);

                    // Remove one spare parts box
                    this.sparePartsBoxes--;
                }
            }

        // DROPPING WEAPON
            // Check if player is dropping weapon
            if (this.isDroppingWeapon) {
                if (!this.hasDroppedWeapon) {
                    this.hasDroppedWeapon = true;

                    // Drop weapon
                    this.dropWeapon();

                    // If player is inside a drop, pick it up
                    if (this.insideWeaponDrop) {
                        this.pickupDrop(this.insideWeaponDrop);
                    }
                }
            } else {
                this.hasDroppedWeapon = false;
            }
    };

    Player.prototype.calculateJoint = function(dest, p1, p2, length, invert) {
        // Work out middle
        var midX = (p1[0] + p2[0]) / 2;
        var midY = (p1[1] + p2[1]) / 2;

        // Work out distance to middle
        var midDistX = midX - p1[0];
        var midDistY = midY - p1[1];

        // Work out angle
        var angle = Math.atan2(midDistY, midDistX);

        // Work out dist squared
        var distSquared = midDistX * midDistX + midDistY * midDistY;

        // Work out height of joint
        var jointHeight = Math.sqrt(Math.abs(length * length - distSquared));

        // Work out angle
        var jointAngle = angle + Math.atan2(jointHeight, Math.sqrt(distSquared)) * invert;

        // Work out position
        dest[0] = p1[0] + length * Math.cos(jointAngle);
        dest[1] = p1[1] + length * Math.sin(jointAngle);
    };

    Player.prototype.buildSkeleton = function() {
        // Get skeleton
        var hipPosition = this.skeleton.hipPosition;
        var neckPosition = this.skeleton.neckPosition;
        var middlePosition = this.skeleton.middlePosition;
        var headPosition = this.skeleton.headPosition;
        var leftFootPosition = this.skeleton.leftFootPosition;
        var rightFootPosition = this.skeleton.rightFootPosition;
        var leftKneePosition = this.skeleton.leftKneePosition;
        var rightKneePosition = this.skeleton.rightKneePosition;
        var leftElbowPosition = this.skeleton.leftElbowPosition;
        var rightElbowPosition = this.skeleton.rightElbowPosition;
        var leftHandPosition = this.skeleton.leftHandPosition;
        var rightHandPosition = this.skeleton.rightHandPosition;

        // Hip position
        hipPosition[0] = 0;
        hipPosition[1] = - this.hipHeight;

        // Neck position
        neckPosition[0] = hipPosition[0];
        neckPosition[1] = hipPosition[1] - this.neckHeight;

        // Add recoil to neck position
        if (this.weapon && this.weapon.recoil) {
            if (this.facingLeft) {
                neckPosition[0] = Math.cos(this.pitch) * this.weapon.recoil * 0.5;
            } else {
                neckPosition[0] -= Math.cos(this.pitch) * this.weapon.recoil * 0.5;
            }
            neckPosition[1] -= Math.sin(this.pitch) * this.weapon.recoil * 0.5;
        }

        // Middle position
        middlePosition[0] = (hipPosition[0] + neckPosition[0]) / 2;
        middlePosition[1] = (hipPosition[1] + neckPosition[1]) / 2;

        // Work out foot stand position
        var leftFootStand = vec2.set(vec2.create(), hipPosition[0] - 20, 0);
        var rightFootStand = vec2.set(vec2.create(), hipPosition[0] + 20, 0);

        // Initialise foot position to stand position
        leftFootPosition[0] = leftFootStand[0];
        leftFootPosition[1] = leftFootStand[1];
        rightFootPosition[0] = rightFootStand[0];
        rightFootPosition[1] = rightFootStand[1];

        // Work out foot move position (this overrides stand position)
        if (this.legDirection != 0) {
            var hipHeightExtra = 0;
            if (this.isRunning) {
                hipHeightExtra = this.hipHeight / 8;
            }

            // Work out foot X
            leftFootPosition[0] = hipPosition[0] + Math.sin(-this.movePhase) * this.hipHeight / 2;
            rightFootPosition[0] = hipPosition[0] + Math.sin(-this.movePhase + Math.PI) * this.hipHeight / 2;

            // Work out foot position
            leftFootPosition[1] = hipPosition[1] + this.hipHeight + Math.cos(-this.movePhase) * this.hipHeight / 4 - hipHeightExtra;
            rightFootPosition[1] = hipPosition[1] + this.hipHeight + Math.cos(-this.movePhase + Math.PI) * this.hipHeight / 4 - hipHeightExtra;

            // Make sure feet don't go through the floor
            if (leftFootPosition[1] > hipPosition[1] + this.hipHeight) {
                leftFootPosition[1] = hipPosition[1] + this.hipHeight;
            }
            if (rightFootPosition[1] > hipPosition[1] + this.hipHeight) {
                rightFootPosition[1] = hipPosition[1] + this.hipHeight;
            }
        }

        // Work out knee inversion
        var leftKneeInversion = 1;
        var rightKneeInversion = -1;
        if (this.legDirection != 0) {
            leftKneeInversion = -1;
            rightKneeInversion = -1;
        }

        // Interpolate between stand position move position
        var transition = Math.abs(this.legDirection);
        vec2.lerp(leftFootPosition, leftFootStand, leftFootPosition, transition);
        vec2.lerp(rightFootPosition, rightFootStand, rightFootPosition, transition);
        leftKneeInversion = 1 + (leftKneeInversion - 1) * transition;
        rightKneeInversion = -1 + (rightKneeInversion + 1) * transition;

        // Work out knee positions
        this.calculateJoint(leftKneePosition, hipPosition, leftFootPosition, this.legHeight, leftKneeInversion);
        this.calculateJoint(rightKneePosition, hipPosition, rightFootPosition, this.legHeight, rightKneeInversion);

        // Hands
        leftHandPosition[0] = this.leftHandPosition[0];
        leftHandPosition[1] = this.leftHandPosition[1];
        rightHandPosition[0] = this.rightHandPosition[0];
        rightHandPosition[1] = this.rightHandPosition[1];

        // Elbows
        this.calculateJoint(leftElbowPosition, vec2.create(), leftHandPosition, 55, 1);
        this.calculateJoint(rightElbowPosition, vec2.create(), rightHandPosition, 55, 1);

        // Invert if moving left
        if (this.legDirection < 0) {
            leftKneePosition[0] = -leftKneePosition[0];
            rightKneePosition[0] = -rightKneePosition[0];
            leftFootPosition[0] = -leftFootPosition[0];
            rightFootPosition[0] = -rightFootPosition[0];
        }

        // Head
        headPosition[0] = 0;
        headPosition[1] = -30;

        // Transform arm and head positions

        // Rotate
        function rotate(dest, src, a, b) {
            if (dest == src) {
                src = vec2.clone(src);
            }
            dest[0] = src[0] * b - src[1] * a;
            dest[1] = src[0] * a + src[1] * b;
        }

        var a = Math.sin(this.pitch);
        var b = Math.cos(this.pitch);
        rotate(leftHandPosition, leftHandPosition, a, b);
        rotate(rightHandPosition, rightHandPosition, a, b);
        rotate(leftElbowPosition, leftElbowPosition, a, b);
        rotate(rightElbowPosition, rightElbowPosition, a, b);
        rotate(headPosition, headPosition, a, b);

        // Invert if facing left
        if (this.facingLeft) {
            leftElbowPosition[0] = -leftElbowPosition[0];
            rightElbowPosition[0] = -rightElbowPosition[0];
            leftHandPosition[0] = -leftHandPosition[0];
            rightHandPosition[0] = -rightHandPosition[0];
            headPosition[0] = -headPosition[0];
        }

        // Translate
        leftHandPosition[0] += neckPosition[0];
        leftHandPosition[1] += neckPosition[1];
        rightHandPosition[0] += neckPosition[0];
        rightHandPosition[1] += neckPosition[1];
        leftElbowPosition[0] += neckPosition[0];
        leftElbowPosition[1] += neckPosition[1];
        rightElbowPosition[0] += neckPosition[0];
        rightElbowPosition[1] += neckPosition[1];
        headPosition[0] += neckPosition[0];
        headPosition[1] += neckPosition[1];

        // Add all positions to player position
        for (var vectorID in this.skeleton) {
            var vector = this.skeleton[vectorID];
            vec2.add(vector, vector, this.origin);
            vec2.add(vector, vector, this.physicsEntity.position);
        }
    };

    Player.prototype.draw = function(context, camera) {
        // Check that this player is alive
        if (!this.inGame) {
            return
        }

        // Get skeleton
        var hipPosition = this.skeleton.hipPosition;
        var neckPosition = this.skeleton.neckPosition;
        var middlePosition = this.skeleton.middlePosition;
        var headPosition = this.skeleton.headPosition;
        var leftFootPosition = this.skeleton.leftFootPosition;
        var rightFootPosition = this.skeleton.rightFootPosition;
        var leftKneePosition = this.skeleton.leftKneePosition;
        var rightKneePosition = this.skeleton.rightKneePosition;
        var leftElbowPosition = this.skeleton.leftElbowPosition;
        var rightElbowPosition = this.skeleton.rightElbowPosition;
        var leftHandPosition = this.skeleton.leftHandPosition;
        var rightHandPosition = this.skeleton.rightHandPosition;

        // Save context
        context.save();

        // Setup
        context.lineWidth = 10;
        context.lineJoin = "round";
        context.lineCap = "round";

        // Start lower body
        context.beginPath();

        // Lower body
        if (!this.parts.lowerBody.isFractured) {
            this.parts.lowerBody.draw(context);

            // Left leg
            if (!this.parts.upperLeftLeg.isFractured) {
                this.parts.upperLeftLeg.draw(context);
                if (!this.parts.lowerLeftLeg.isFractured) {
                    this.parts.lowerLeftLeg.draw(context);
                }
            }

            // Right leg
            if (!this.parts.upperRightLeg.isFractured) {
                this.parts.upperRightLeg.draw(context);
                if (!this.parts.lowerRightLeg.isFractured) {
                    this.parts.lowerRightLeg.draw(context);
                }
            }
        }

        // Draw lower body
        context.stroke();

        // Start upper body
        context.beginPath();

        // Upper body
        if (!this.parts.upperBody.isFractured) {
            this.parts.upperBody.draw(context);

            // Backpack
            if (this.weapon) {
                // Transform
                context.save();
                context.translate(this.skeleton.neckPosition[0], this.skeleton.neckPosition[1]);
                if (this.facingLeft) {
                    context.scale(-1, 1);
                }

                // Draw
                this.weapon.drawBackpack(context);

                // Restore
                context.restore();
            }

            // Left arm
            if (!this.parts.upperLeftArm.isFractured) {
                this.parts.upperLeftArm.draw(context);
                if (!this.parts.lowerLeftArm.isFractured) {
                    this.parts.lowerLeftArm.draw(context);
                }
            }

            // Draw left arm and upper body
            context.stroke();

            // Weapon
            if (this.weapon) {
                // Transform
                context.save();
                context.translate(this.skeleton.neckPosition[0], this.skeleton.neckPosition[1]);
                if (this.facingLeft) {
                    context.scale(-1, 1);
                }
                context.rotate(this.pitch);

                // Draw
                this.weapon.drawWeapon(context);

                // Restore
                context.restore();
            }

            // Start right arm
            context.beginPath();

            // Right arm
            if (!this.parts.upperRightArm.isFractured) {
                this.parts.upperRightArm.draw(context);
                if (!this.parts.lowerRightArm.isFractured) {
                    this.parts.lowerRightArm.draw(context);
                }
            }

            // Draw right arm
            context.stroke();

            // Start head
            context.beginPath();

            // Head
            if (!this.parts.head.isFractured) {
                this.parts.head.draw(context);
            }

            // Draw head
            context.fill();

            // Hat
            if (!this.parts.head.isFractured) {
                if (this.weapon) {
                    // Transform
                    context.save();
                    context.translate(this.skeleton.neckPosition[0], this.skeleton.neckPosition[1]);
                    if (this.facingLeft) {
                        context.scale(-1, 1);
                    }
                    context.rotate(this.pitch);

                    // Draw
                    this.weapon.drawHat(context);

                    // Restore
                    context.restore();
                }
            }
        }

        // Restore context
        context.restore();
    };

    Player.prototype.getScore = function() {
        return this.kills * 100 + this.assists * 50;
    };

    Player.prototype.think = function() {
        // Run
        this.isRunning = true;

        // Change direction randomly
        this.move = (Math.random() > 0.75) ? ((this.move == 1) ? 2 : 1) : this.move;

        // If blocked, turn around
        if (this.move == 1) {
            if (this.physicsEntity.touching.right) {
                this.move = -1;
            }
        } else if (this.move == -1) {
            if (this.physicsEntity.touching.left) {
                this.move = 1;
            }
        } else {
            this.move = (Math.random() > 0.5) ? 1 : -1;
        }

        // Target closest enemy
        var currentDistance = 0;
        var currentClosestPlayer = null;
        for (var playerID in this.scene.players) {
            var player = this.scene.players[playerID];

            // Make sure the player is not itself and that it is alive
            if (player == this || !player.inGame) {
                continue;
            }

            // Check that the player is in view
            if (this.scene.map.linecastTiles(this.targetPoint, player.targetPoint).collision) {
                continue;
            }

            // Calculate distance
            var distance = vec2.dist(player.targetPoint, this.targetPoint);

            // Check that distance is in range
            if (distance < 50 || distance > 1000) {
                continue;
            }

            // Check if this is the closest player
            if (currentClosestPlayer == null ) {
                currentDistance = distance;
                currentClosestPlayer = player;
            } else {
                if (currentDistance > distance) {
                    currentDistance = distance;
                    currentClosestPlayer = player;
                }
            }
        }

        // Set target
        if (currentClosestPlayer != null) {
            this.target = currentClosestPlayer.targetPoint;
            this.isShooting = true;
        } else {
            this.target = null;
            this.isShooting = false;
        }
    };

    Object.freeze(Player.prototype);

    return Player;
})();
