import assets from './assets.json' assert {type: 'json'};
import FlappyBird from './characterSprite.js';

let gameDifficult = "";
let isGamePaused = false;

class GameScene extends Phaser.Scene {
	constructor(){
		super("FlappyBird");
	}

	preload(){
		let game = this;
		this.load.image(assets.scene.background.day, 'assets/background-day.png');
		this.load.image(assets.scene.background.night, 'assets/background-night.png');
		this.load.spritesheet(assets.scene.ground, 'assets/ground-sprite.png', {
			frameWidth: 336,
			frameHeight: 112
		});

		this.load.image(assets.scene.startGame, 'assets/startgame.png');
		this.load.image(assets.scene.pauseGame, 'assets/pause-button.png');
		this.load.image(assets.scene.resumeGame, 'assets/resume-button.png');
		this.load.image(assets.scene.gameOver, 'assets/gameover.png');
		this.load.image(assets.scene.restartGame, 'assets/restart-button.png');
		this.load.image(assets.scene.difficult.easy, 'assets/easy-button.png');
		this.load.image(assets.scene.difficult.medium, 'assets/medium-button.png');
		this.load.image(assets.scene.difficult.hard, 'assets/hard-button.png');
		this.load.image(assets.scene.difficult.changeDifficult, 'assets/change-diff-button.png');

		[assets.obstacle.pipe.green, assets.obstacle.pipe.red].forEach(function(pipe){
			game.load.image(pipe.top, `assets/${pipe.top}.png`);
			game.load.image(pipe.bottom, `assets/${pipe.bottom}.png`);
		});

		Object.keys(assets.bird).forEach(function(key){
			let bird = assets.bird[key].name;
			game.load.spritesheet(bird, `assets/${bird}-sprite.png`, {
				frameWidth: 34,
				frameHeight: 24
			});
		});
		this.load.image(assets.scoreboard.score, 'assets/score.png');
	}

	create(){
		let game = this;
		this.backgroundDay = this.add.image(assets.scene.width, 256, assets.scene.background.day).setInteractive();
		this.backgroundNight = this.add.image(assets.scene.width, 256, assets.scene.background.night).setInteractive();
		this.backgroundNight.visible = false;
		this.gaps = this.physics.add.group();
		this.pipes = this.physics.add.group();

		Object.keys(assets.bird).forEach(function(key){
			game.anims.create({
				key: assets.bird[key].clapWings,
				frames: game.anims.generateFrameNumbers(assets.bird[key].name, {
					start: 0,
					end: 2
				}),
				frameRate: 10,
				repeat: -1
			});

			game.anims.create({
				key: assets.bird[key].stop,
				frames: [{
					key: assets.bird[key].name,
					frame: 1
				}],
				frameRate: 20
			});
		});

		this.ground = this.physics.add.sprite(assets.scene.width, 468, assets.scene.ground);
		this.ground.setCollideWorldBounds(true);
		this.ground.setDepth(20);
		this.ground.setSize(0, 100, 0, 0).setOffset(0, 10);
		this.anims.create({ key: assets.animation.ground.moving, 
			frames: this.anims.generateFrameNumbers(assets.scene.ground, {
				start: 0,
				end: 2
			}),
			frameRate: 15,
			repeat: -1
		});

		this.anims.create({ key: assets.animation.ground.moving, 
			frames:[{
				key: assets.scene.ground,
				frame: 0
			}],
			frameRate: 20
		});

		this.start = this.add.image(assets.scene.width, 156, assets.scene.startGame);
		this.start.setDepth(30);
		this.start.visible = false;

		this.pause = this.add.image(assets.scene.width, 480, assets.scene.pauseGame);
		this.pause.setDepth(30);
		this.pause.visible = false;
		this.pause.on('pointerdown', () => { this.pauseGame() });

		this.resume = this.add.image(assets.scene.width, 480, assets.scene.resumeGame);
		this.resume.setDepth(30);
		this.resume.visible = false;
		this.resume.on('pointerdown', () => this.resumeGame());

		this.easy = this.add.image(assets.scene.width, 200, assets.scene.difficult.easy).setInteractive();
		this.easy.setDepth(20);
		this.easy.visible = false;
		this.easy.on('pointerdown', () => this.setDifficult("Easy"));

		this.medium = this.add.image(assets.scene.width, 250, assets.scene.difficult.medium).setInteractive();
		this.medium.setDepth(20);
		this.medium.visible = false;
		this.medium.on('pointerdown', () => this.setDifficult("Medium"));

		this.hard = this.add.image(assets.scene.width, 300, assets.scene.difficult.hard).setInteractive();
		this.hard.setDepth(20);
		this.hard.visible = false;
		this.hard.on('pointerdown', () => this.setDifficult("Hard"));

		this.gameOver = this.add.image(assets.scene.width, 100, assets.scene.gameOver);
		this.gameOver.setDepth(20);
		this.gameOver.visible = false;

		this.restart = this.add.image(assets.scene.width, 300, assets.scene.restartGame).setInteractive();
		this.restart.setDepth(20);
		this.restart.visible = false;
		this.restart.on('pointerdown', () => this.restartGame(this));

		this.changeDifficult = this.add.image(assets.scene.width, 350, assets.scene.difficult.changeDifficult).setInteractive();
		this.changeDifficult.setDepth(20);
		this.changeDifficult.visible = false;
		this.changeDifficult.on('pointerdown', () => {gameDifficult = ""; this.hasDifficultChangeRequested = true; this.restartGame(this);});

		this.scoreboard = this.add.image(assets.scene.width, 200, assets.scoreboard.score);
		this.scoreboard.scale = 0.5;
		this.scoreboard.setDepth(30);

		this.scoreTxt = this.add.text(assets.scene.width, 40, 
			'0', {
				fontFamily: 'font1', 
				fontSize: '38px', 
				fill: '#fff', 
				stroke: '#000',
				strokeThickness: 4,
				strokeLinecap: 'square',
				shadow: {
					offsetX: 2.5,
					offsetY: 3,
					color: '#000',
					blur: 0,
					stroke: true,
					fill: true
				}
			}
		);
		this.scoreTxt.setDepth(30);
		this.scoreTxt.setOrigin(0.5);
		this.scoreTxt.alpha = 0;

		this.scored = this.add.text(assets.scene.width+5, 186, 
			'0', { 
					fontFamily: 'font1', 
					fontSize: '18px', 
					fill: '#fff', 
					stroke: '#000',
					strokeThickness: 3,
				}
			);
		this.scored.setDepth(30);
		this.scored.setOrigin(0.5);

		this.bestScore = this.add.text(assets.scene.width+5, 225, 
			'0', { 
					fontFamily: 'font1', 
					fontSize: '18px', 
					fill: '#fff', 
					stroke: '#000',
					strokeThickness: 3,
				}
			);
		this.bestScore.setDepth(30);
		this.bestScore.setOrigin(0.5, 0.5);

		this.initGame();
	}

	update(){
		if (isGamePaused) return;
		if (this.isGameOver) return;
		if (!this.hasGameStarted) return;

		this.flappyBird.falls();

		let xVelocity = gameDifficult == "Easy" ? -100 : gameDifficult == "Medium" ? -200 : -250;
		let nextPipeVelocity = gameDifficult == "Easy" ? 130 : gameDifficult == "Medium" ? 80 : 65;

		this.pipes.children.iterate(function(pipe){
			if (pipe == undefined) return;
			if (pipe.x < -50) pipe.destroy();
			else pipe.setVelocityX(xVelocity);
		});

		this.gaps.children.iterate(function(gap){
			gap.body.setVelocityX(xVelocity);
		});

		this.nextPipes++;

		if (this.nextPipes === nextPipeVelocity){
			this.makePipes();
			this.nextPipes = 0;
		}
	}

	setDifficult(difficult){
		gameDifficult = difficult;
		this.easy.visible = false;
		this.medium.visible = false;
		this.hard.visible = false;
		this.hasDifficultChangeRequested = false;

		this.input.on('pointerdown', function () {
			this.flapBird();
		}, this);
	}

	initGame(){
		this.isGamePaused = false;
		this.nextPipes = 0;
		this.score = 0;
		this.isGameOver = false;
		this.currentPipe = assets.obstacle.pipe.green;

		if(gameDifficult == ""){
			this.easy.visible = true;
			this.medium.visible = true;
			this.hard.visible = true;
		}
		this.gameOver.visible = false;
		this.scoreboard.visible = false;
		this.scored.visible = false;
		this.bestScore.visible = false;
		this.backgroundDay.visible = true;
		this.backgroundNight.visible = false;
		this.currentPipe = assets.obstacle.pipe.green;
		this.flappyBird = new FlappyBird(this, 60, 265);

		this.physics.add.collider(this.flappyBird, this.ground, this.hitBird, null, this);
		this.physics.add.overlap(this.flappyBird, this.pipes, this.hitBird, null, this);
		this.physics.add.overlap(this.flappyBird, this.gaps, this.updateScore, null, this);
		this.ground.anims.play( assets.animation.ground.moving, true );
		
	}

	flapBird(){
		if (isGamePaused) return;
		if (this.isGameOver) return;
		if (this.hasDifficultChangeRequested) return;
		if (!this.hasGameStarted) this.startGame();
		this.flappyBird.flap();
	}

	saveScore(){
		let bestScore = parseInt(localStorage.getItem('bestScore'));
		if (bestScore){
			localStorage.setItem('bestScore', Math.max(this.score, bestScore));
			this.bestScore.setText(bestScore);
		} else {
			localStorage.setItem('bestScore', this.score);
			this.bestScore.setText(0);
		}
		this.scored.setText(this.score);
		this.scored.visible = true;
		this.bestScore.visible = true;
	}

	hitBird(){
		this.pipes.children.iterate(function(pipe){
			if (pipe == undefined) return;
			pipe.setVelocityX(0);
		});

		this.saveScore();
		this.isGameOver = true;
		this.scoreboard.visible = true;
		this.hasGameStarted = false;
		this.flappyBird.die();
		this.ground.anims.stop(assets.animation.ground.moving, true);
		this.gameOver.visible = true;
		this.restart.visible = true;
		this.changeDifficult.visible = true;
		this.scoreTxt.setText('');
	}

	restartGame(scene){
		scene.pipes.clear(true, true);
		scene.gaps.clear(true, true);
		scene.flappyBird.destroy();
		scene.gameOver.visible = false;
		scene.scoreboard.visible = false;
		scene.restart.visible = false;
		scene.changeDifficult.visible = false;
		scene.scoreTxt.setText('0');
		scene.initGame();
	}

	updateScore(_, gap){
		this.score++;
		gap.destroy();

		if (this.score % 10 == 0){
			this.backgroundDay.visible = !this.backgroundDay.visible;
			this.backgroundNight.visible = !this.backgroundNight.visible;
			if (this.currentPipe === assets.obstacle.pipe.green){
				this.currentPipe = assets.obstacle.pipe.red;
			} else {
				this.currentPipe = assets.obstacle.pipe.green;
			}
		}
		this.scoreTxt.setText(this.score);
	}

	startGame(){
		this.scoreTxt.alpha = 1;
		this.hasGameStarted = true;
		this.start.visible = false;
		this.pause.visible = true;
		this.makePipes();
	}

	pauseGame() {
		this.pause.visible = false;
		this.resume.visible = true;
		isGamePaused = true;
	}

	resumeGame() {
		this.pause.visible = true;
		this.resume.visible = false;
		isGamePaused = false;
	}

	makePipes(){
		let downPipeGap = gameDifficult == "Easy" ? 520 : gameDifficult == "Medium" ? 480 : 420;
		if (!this.hasGameStarted) return;
		if (this.isGameOver) return;
		const top = Phaser.Math.Between(-120, 120);
		const gap = this.add.line(288, top + 210, 0, 0, 0, 98);
		this.gaps.add(gap);
		gap.body.allowGravity = false;
		gap.visible = false;
		const pipeTop = this.pipes.create(288, top, this.currentPipe.top).setImmovable(true);
		pipeTop.body.allowGravity = false;
		const pipeBottom = this.pipes.create(288, top + downPipeGap, this.currentPipe.bottom).setImmovable(true);
		pipeBottom.body.allowGravity = false;
	}
}

export default GameScene;