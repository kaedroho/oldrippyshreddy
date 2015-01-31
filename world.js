import ndarray from "ndarray";


export default class World {
    constructor(sizeX, sizeY) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.grid = new ndarray(new Int8Array(sizeX * sizeY), [sizeX, sizeY]);
    }

    fillArea(x, y, width, height, value) {
        for (var i = 0; i < width; i++) {
            for (var j = 0; j < height; j++) {
                this.grid.set(x+i, y+j, value);
            }
        }
    }

    draw(context) {
        for (var i = 0; i < this.sizeX; i++) {
            for (var j = 0; j < this.sizeY; j++) {
                var value = this.grid.get(i, j);

                if (value) {
                    context.fillRect(i, j, 1, 1);
                }
            }
        }
    }
}
