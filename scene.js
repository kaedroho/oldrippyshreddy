import loop from "raf-loop";
import mousePosition from "mouse-position";

import Camera from "./camera";
import Player from "./player";
import World from "./world";


export default class Scene {
    constructor(canvas) {
        this.canvas = canvas;

        this.context = canvas.getContext("2d");
        this.updateCanvasSize()

        this.mouse = mousePosition(this.canvas);

        this.camera = new Camera(this.canvas.width, this.canvas.height);

        this.entities = {
            players: [],
        };

        this.world = new World(100, 100);

        this.engine = null;

        this.input = {
            upArrowKey: false,
            leftArrowKey: false,
            downArrowKey: false,
            rightArrowKey: false,
            wKey: false,
            aKey: false,
            sKey: false,
            dKey: false,
            qKey: false,
            eKey: false,
        };

        var input = this.input;

        document.body.onkeydown = function(event) {
            if (event.which == 38) {
                input.upArrowKey = true;
            } else if (event.which == 37) {
                input.leftArrowKey = true;
            } else if (event.which == 40) {
                input.downArrowKey = true;
            } else if (event.which == 39) {
                input.rightArrowKey = true;
            } else if (event.which == 87) {
                input.wKey = true;
            } else if (event.which == 65) {
                input.aKey = true;
            } else if (event.which == 83) {
                input.sKey = true;
            } else if (event.which == 68) {
                input.dKey = true;
            } else if (event.which == 81) {
                input.qKey = true;
            } else if (event.which == 69) {
                input.eKey = true;
            }
        };

        document.body.onkeyup = function(event) {
            if (event.which == 38) {
                input.upArrowKey = false;
            } else if (event.which == 37) {
                input.leftArrowKey = false;
            } else if (event.which == 40) {
                input.downArrowKey = false;
            } else if (event.which == 39) {
                input.rightArrowKey = false;
            } else if (event.which == 87) {
                input.wKey = false;
            } else if (event.which == 65) {
                input.aKey = false;
            } else if (event.which == 83) {
                input.sKey = false;
            } else if (event.which == 68) {
                input.dKey = false;
            } else if (event.which == 81) {
                input.qKey = false;
            } else if (event.which == 69) {
                input.eKey = false;
            }
        };

        // SETUP GAME

        // Right fort
        this.world.fillArea(35, 13, 8, 1, 1);
        this.world.fillArea(35, 0, 1, 13, 1);
        this.world.fillArea(35, 0, 20, 1, 1);
        this.world.fillArea(55, 0, 1, 22, 1);
        this.world.fillArea(35, 22, 21, 1, 1);
        this.world.fillArea(50, 16, 5, 6, 1);

        // Left fort
        this.world.fillArea(13, 13, 8, 1, 1);
        this.world.fillArea(20, 0, 1, 13, 1);
        this.world.fillArea(0, 0, 20, 1, 1);
        this.world.fillArea(0, 0, 1, 22, 1);
        this.world.fillArea(0, 22, 21, 1, 1);
        this.world.fillArea(1, 16, 5, 6, 1);

        // Middle
        this.world.fillArea(21, 22, 14, 1, 1);

        // Create main player
        var player = new Player();
        this.entities.players.push(player);

        player.spawn([10, 10]);
    }

    updateCanvasSize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    tick(dt) {
        this.updateCanvasSize();
        this.camera.resize(this.canvas.width, this.canvas.height);

        this.context.save();

        // Transform context
        this.camera.transformContext(this.context);

        // Draw world
        this.world.draw(this.context);

        // Draw players
        var context = this.context;
        this.entities.players.forEach((player) => {
            player.draw(context);

            this.camera.setPosition(player.stickman.position[0], player.stickman.position[1])

            player.stickman.velocity[0] = 0;
            player.stickman.velocity[1] = 0;
            if (this.input.upArrowKey) {
                player.stickman.velocity[1] -= 4;
            }
            if (this.input.downArrowKey) {
                player.stickman.velocity[1] += 4;
            }
            if (this.input.leftArrowKey) {
                player.stickman.velocity[0] -= 4;
            }
            if (this.input.rightArrowKey) {
                player.stickman.velocity[0] += 4;
            }
        });

        this.context.restore();
    }

    start() {
        this.engine = loop((dt) => this.tick()).start();
    }

    stop() {
        this.engine.stop();
        this.engine = null;
    }
}
