import FlappyBirdScene from './js/GameScene.js';

window.onload = function(){
    const config = {
        type: Phaser.AUTO,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {
                    y: 600
                },
                debug: false
            }
        },
        scale: {
            mode: Phaser.Scale.FIT,
            width: 288,
            height: 512
        },
        scene : [ FlappyBirdScene ]
    };

    const game = new Phaser.Game(config);
}

