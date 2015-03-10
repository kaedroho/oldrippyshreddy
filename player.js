class BasePlayer {
    constructor() {
        this.input = {
            move: 0,
            jump: false,
            duck: false,
            target: null,
        };
    }
}


export class LocalPlayer extends BasePlayer {

}


export class RemotePlayer extends BasePlayer {

}
