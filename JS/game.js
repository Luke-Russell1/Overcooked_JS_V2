import CollabScene from './collabscene.js';
import CompScene from './compscene.js';

var config = {
    type: Phaser.AUTO,
    width: 20*45,
    height: 16*45,
    pixelArt: true,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

class Game extends Phaser.Game {
    constructor() {
        super(config);
        
        // Adding scenes
        this.scene.add('CollabScene', new CollabScene());
        this.scene.start('CollabScene');
        this.scene.add('CompScene', new CompScene());
        console.log(this.scene.keys);
    }
}

window.onload = function() {
    window.game = new Game();
}
