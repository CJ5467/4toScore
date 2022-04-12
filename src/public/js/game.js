// red is 0xff0000, yellow is 0xffff00
import GameScene from './gamescene.js';


var config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    width: 1000,
    height: 600,
    autoCenter: true,
    dom: {
        createContainer: true
    },
    scene: [GameScene]
};

var game = new Phaser.Game(config);