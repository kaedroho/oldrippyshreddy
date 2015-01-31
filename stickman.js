import vec2 from "gl-vec2";


export default class Stickman {
    constructor(initialPosition) {
        this.position = vec2.clone(initialPosition);
        this.velocity = vec2.create();
    }

    draw(context) {
        context.fillRect(this.position[0], this.position[1], 1, 3.5);
    }
}
