export default class StickmanPart {
    constructor(durability, p1, p2, radius) {
        // IMMUTABLE
        this.durability = durability;
        this.p1 = p1;
        this.p2 = p2;
        this.radius = radius;

        this.isFractured = false;
    }

    draw(context) {
        if (this.radius > 0) {
            context.arc(this.p1[0], this.p1[1], 30, 0, Math.PI * 2);
        } else {
            context.moveTo(this.p1[0], this.p1[1]);
            context.lineTo(this.p2[0], this.p2[1]);
        }
    }
}
