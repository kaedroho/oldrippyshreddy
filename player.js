import Stickman from "./stickman"


export default class Player {
    constructor() {
        this.stickman = null;
    }

    spawn(initialPosition) {
        this.stickman = new Stickman(initialPosition);
    }

    draw(context) {
        if (this.stickman) {
            this.stickman.draw(context);
        }
    }
}
