import vec2 from "gl-vec2";

import StickmanPart from "./part";


function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}


export default class Stickman {
    constructor(player, initialPosition) {
        this.player = player;
        this.position = vec2.clone(initialPosition);
        this.positionNext = vec2.clone(initialPosition);
        this.velocity = vec2.create();

        this.origin = vec2.create();

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

        this.leftHandPosition = vec2.create();
        this.rightHandPosition = vec2.create();

        this.parts = {
            head: new StickmanPart(200, this.skeleton.headPosition, this.skeleton.neckPosition, 30),
            upperBody: new StickmanPart(200, this.skeleton.neckPosition, this.skeleton.middlePosition, 0),
            lowerBody: new StickmanPart(200, this.skeleton.middlePosition, this.skeleton.hipPosition, 0),
            upperLeftLeg: new StickmanPart(100, this.skeleton.hipPosition, this.skeleton.leftKneePosition, 0),
            lowerLeftLeg: new StickmanPart(100, this.skeleton.leftKneePosition, this.skeleton.leftFootPosition, 0),
            upperRightLeg: new StickmanPart(100, this.skeleton.hipPosition, this.skeleton.rightKneePosition, 0),
            lowerRightLeg: new StickmanPart(100, this.skeleton.rightKneePosition, this.skeleton.rightFootPosition, 0),
            upperLeftArm: new StickmanPart(100, this.skeleton.neckPosition, this.skeleton.leftElbowPosition, 0),
            lowerLeftArm: new StickmanPart(100, this.skeleton.leftElbowPosition, this.skeleton.leftHandPosition, 0),
            upperRightArm: new StickmanPart(100, this.skeleton.neckPosition, this.skeleton.rightElbowPosition, 0),
            lowerRightArm: new StickmanPart(100, this.skeleton.rightElbowPosition, this.skeleton.rightHandPosition, 0),
        };

        this.facingLeft = false;
        this.pitch = 0;
        this.legDirection = 0;
        this.duckTransition = 0;
        this.movePhase = 0;
    }

    tick(dt) {
        // Velocity
        this.velocity[0] = this.player.input.move * 10;

        // Position
        this.positionNext[0] += this.velocity[0] * dt;
        this.positionNext[1] += this.velocity[1] * dt;
    }

    loop(dt, at, context) {
        // Interpolate position
        // FIXME: Don't hardcode tickrate here
        this.position[0] = this.positionNext[0] - this.velocity[0] * (0.03 - at);
        this.position[1] = this.positionNext[1] - this.velocity[1] * (0.03 - at);

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
            // Find duck speed
            var duckDistanceLeft = Math.abs((this.player.input.duck ? 1 : 0) - this.duckTransition);
            var duckSpeed = duckDistanceLeft * dt * 10;

            // Update duck transition
            if (this.player.input.duck && legCount > 0) {
                this.duckTransition += duckSpeed;
            } else {
                this.duckTransition -= duckSpeed;
            }

            // Make sure it stays between 0 and 1
            this.duckTransition = clampNumber(this.duckTransition, 0, 1)

        // Update
        this.updateSkeleton(dt);

        // Draw
        context.save();
        context.translate(this.position[0], this.position[1]);
        context.scale(1/64, 1/64);
        this.draw(context);
        context.restore();
    }

    updateSkeleton(dt) {
        var standNeckHeight = 100;
        var duckNeckHeight = 75;
        var standHipHeight = 75;
        var duckHipHeight = 50;
        var legHeight = 40;

        // Calculate neck/hip height
        var neckHeight = standNeckHeight + (duckNeckHeight - standNeckHeight) * this.duckTransition;
        var hipHeight = standHipHeight + (duckHipHeight - standHipHeight) * this.duckTransition;

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
        hipPosition[1] = - hipHeight;

        // Neck position
        neckPosition[0] = hipPosition[0];
        neckPosition[1] = hipPosition[1] - neckHeight;

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
                hipHeightExtra = hipHeight/ 8;
            }

            // Work out foot X
            leftFootPosition[0] = hipPosition[0] + Math.sin(-this.movePhase) * hipHeight / 2;
            rightFootPosition[0] = hipPosition[0] + Math.sin(-this.movePhase + Math.PI) * hipHeight / 2;

            // Work out foot position
            leftFootPosition[1] = hipPosition[1] + hipHeight + Math.cos(-this.movePhase) * hipHeight / 4 - hipHeightExtra;
            rightFootPosition[1] = hipPosition[1] + hipHeight + Math.cos(-this.movePhase + Math.PI) * hipHeight / 4 - hipHeightExtra;

            // Make sure feet don't go through the floor
            if (leftFootPosition[1] > hipPosition[1] + hipHeight) {
                leftFootPosition[1] = hipPosition[1] + hipHeight;
            }
            if (rightFootPosition[1] > hipPosition[1] + hipHeight) {
                rightFootPosition[1] = hipPosition[1] + hipHeight
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

        function calculateJoint(dest, p1, p2, length, invert) {
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
        }

        // Work out knee positions
        calculateJoint(leftKneePosition, hipPosition, leftFootPosition, legHeight, leftKneeInversion);
        calculateJoint(rightKneePosition, hipPosition, rightFootPosition, legHeight, rightKneeInversion);

        // Hands
        leftHandPosition[0] = this.leftHandPosition[0];
        leftHandPosition[1] = this.leftHandPosition[1];
        rightHandPosition[0] = this.rightHandPosition[0];
        rightHandPosition[1] = this.rightHandPosition[1];

        // Elbows
        calculateJoint(leftElbowPosition, vec2.create(), leftHandPosition, 55, 1);
        calculateJoint(rightElbowPosition, vec2.create(), rightHandPosition, 55, 1);

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
    }

    draw(context) {
        context.lineWidth = 10;
        context.lineJoin = 'round';
        context.lineCap = 'round';

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
    }
}
