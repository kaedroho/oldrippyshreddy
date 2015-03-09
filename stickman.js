import vec2 from "gl-vec2";


export default class Stickman {
    constructor(player, initialPosition) {
        this.player = player;
        this.position = vec2.clone(initialPosition);
        this.velocity = vec2.create();
    }

    tick(dt) {
        this.position[0] += this.velocity[0] * dt;
        this.position[1] += this.velocity[1] * dt;
    }

    draw(context) {
        context.fillRect(this.position[0], this.position[1], 1, 3.5);
    }
}
