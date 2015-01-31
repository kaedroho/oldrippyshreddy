import vec2 from "gl-vec2";


export default class Camera {
    constructor(viewportWidth, viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;

        this.position = vec2.create();
        this.positionTarget = vec2.create();

        this.zoom = 1 / 64;
        this.zoomTarget = 1;
    }

    resize(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    setPosition(x, y) {
        this.position[0] = x;
        this.position[1] = y;

        this.positionTarget[0] = x;
        this.positionTarget[1] = y;
    }

    moveTo(x, y) {
        this.positionTarget[0] = x;
        this.positionTarget[1] = y;
    }

    setZoom(zoom) {
        this.zoom = zoom;
        this.zoomTarget = zoom;
    }

    zoomTo(zoom) {
        this.zoomTarget = zoom;
    }

    update(dt) {
        // Update position
        var diffX = this.positionTarget[0] - this.position[0];
        var diffY = this.positionTarget[1] - this.position[1];
        var moveX = diffX * dt * 10;
        var moveY = diffY * dt * 10;

        if (Math.abs(moveX) > Math.abs(diffX)) {
            this.position[0] = this.positionTarget[0];
        } else {
            this.position[0] = this.position[0] + moveX;
        }

        if (Math.abs(moveY) > Math.abs(diffY)) {
            this.position[1] = this.positionTarget[1];
        } else {
            this.position[1] = this.position[1] + moveY;
        }
    }

    getScale() {
        return Math.max(this.viewportWidth, this.viewportHeight * (16/9)) * this.zoom;
    }

    transformContext(context) {
        context.translate(this.viewportWidth / 2, this.viewportHeight / 2);

        var scale = this.getScale();
        context.scale(scale, scale);

        context.translate(-this.position[0], -this.position[1]);
    }
}
