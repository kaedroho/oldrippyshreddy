import loop from "raf-loop";
import mousePosition from "mouse-position";
import now from "right-now";

import Scene from "./scene";
import Camera from "./camera";
import {LocalPlayer} from "./player";


export default class Client {
    constructor(canvas) {
        this.canvas = canvas;

        this.context = canvas.getContext('2d');
        this.updateCanvasSize()

        this.mouse = mousePosition(this.canvas);

        this.camera = new Camera(this.canvas.width, this.canvas.height);

        this.tickLoop = null;
        this.mainLoop = null;

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

        // Create scene
        this.scene = new Scene();

        // Create main player
        this.player = new LocalPlayer();
        this.scene.players.push(this.player);
        this.stickman = this.scene.spawnPlayer(this.player, [10, 10]);
    }

    updateCanvasSize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    tick(dt) {
        this.player.input.move = 0;
        this.player.input.jump = false;
        this.player.input.duck = false;
        if (this.input.leftArrowKey || this.input.aKey) {
            this.player.input.move -= 1;
        }
        if (this.input.rightArrowKey || this.input.dKey) {
            this.player.input.move += 1;
        }
        if (this.input.upArrowKey || this.input.wKey) {
            this.player.input.jump = true;
        }
        if (this.input.downArrowKey || this.input.sKey) {
            this.player.input.duck = true;
        }

        this.scene.tick(dt);
    }

    loop(dt, at) {
        // Update size
        this.updateCanvasSize();
        this.camera.resize(this.canvas.width, this.canvas.height);

        // Track player
        this.camera.setPosition(this.stickman.position[0], this.stickman.position[1])

        // Draw scene
        this.context.save();
        this.camera.transformContext(this.context);
        this.scene.loop(dt, at, this.context);
        this.context.restore();
    }

    start() {
        // Start tick loop
        var tickRate = 30; // Number of ms between ticks
        var lastTick = now();
        this.tickLoop = setInterval(() => {
            this.tick(tickRate / 1000.0);
            lastTick = now();
        }, tickRate);

        // Start main loop
        this.mainLoop = loop((dt) => {
            var at = now() - lastTick;
            this.loop(dt / 1000.0, at / 1000.0);
        }).start();
    }

    stop() {
        // Stop tick loop
        clearInterval(this.tickLoop);
        this.tickLoop = null;

        // Stop main loop
        this.mainLoop.stop();
        this.mainLoop = null;
    }
}
