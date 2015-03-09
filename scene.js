import Stickman from "./stickman"
import World from "./world";


export default class Scene {
    constructor(canvas) {
        this.players = [];

        this.entities = {
            stickmen: [],
        };

        this.world = new World(100, 100);

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
    }

    spawnPlayer(player, initialPosition) {
        var stickman = new Stickman(player, initialPosition);
        this.entities.stickmen.push(stickman);

        return stickman;
    }

    tick(dt) {
        // Update stickmen
        this.entities.stickmen.forEach((stickman) => {
            stickman.tick(dt);
        });
    }

    loop(dt, context) {
        // Draw world
        this.world.loop(dt, context);

        // Draw stickmen
        this.entities.stickmen.forEach((stickman) => {
            stickman.loop(dt, context);
        });
    }
}
