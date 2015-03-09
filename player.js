class BasePlayer {

}


export class LocalPlayer extends BasePlayer {
    constructor() {
        this.input = {
            move: 0,
            jump: false,
            duck: false,
        };
    }
}
