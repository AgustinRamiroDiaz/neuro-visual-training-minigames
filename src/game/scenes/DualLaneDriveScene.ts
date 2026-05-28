import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { normalizeKeyboardEventKey } from '../inputKeys';
import type { DualLaneDriveSettings, GameSettings } from '../settings';
import type { Minigame } from '../../data/minigames';

type Side = 'left' | 'right';

interface CarState {
  laneIndex: number;
  body: Phaser.GameObjects.Container;
  side: Side;
}

interface Obstacle {
  shape: Phaser.GameObjects.Rectangle;
  laneIndex: number;
  scored: boolean;
  side: Side;
}

export class DualLaneDriveScene extends Phaser.Scene {
  private readonly lanes: Record<Side, number[]> = {
    left: [250, 350],
    right: [550, 650],
  };

  private cars!: Record<Side, CarState>;
  private obstacles: Obstacle[] = [];
  private score = 0;
  private obstaclesPerMinute = 30;
  private spawnElapsedMs = 0;
  private speed = 185;
  private isGameOver = false;
  private minigame?: Minigame;
  private settings: DualLaneDriveSettings = {
    leftKey: 'A',
    rightKey: 'D',
  };
  private scoreText?: Phaser.GameObjects.Text;
  private rateText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'DualLaneDriveScene' });
  }

  init(data: { minigame?: Minigame; gameSettings?: GameSettings }) {
    this.minigame = data.minigame;
    this.settings =
      data.gameSettings?.sceneKey === 'DualLaneDriveScene'
        ? data.gameSettings.settings
        : { leftKey: 'A', rightKey: 'D' };
    this.obstacles = [];
    this.score = 0;
    this.obstaclesPerMinute = 30;
    this.spawnElapsedMs = 0;
    this.speed = 185;
    this.isGameOver = false;
  }

  create() {
    this.cameras.main.setBackgroundColor('#f6f3ee');
    this.createRoad();
    this.createHud();

    this.cars = {
      left: this.createCar('left', 0, 0x2f7dff),
      right: this.createCar('right', 1, 0xe24d68),
    };

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.handleKeyDown(event));

    this.createControlButton(250, 508, 'Left car', this.settings.leftKey, () =>
      this.switchLane('left'),
    );
    this.createControlButton(650, 508, 'Right car', this.settings.rightKey, () =>
      this.switchLane('right'),
    );

    EventBus.emit('current-scene-ready', this);
  }

  update(_: number, delta: number) {
    if (this.isGameOver) {
      return;
    }

    const distance = (this.speed * delta) / 1000;
    this.updateObstacleSpawner(delta);

    this.obstacles.forEach((obstacle) => {
      obstacle.shape.y += distance;

      if (!obstacle.scored && obstacle.shape.y > 455) {
        obstacle.scored = true;
        this.addScore();
      }

      if (this.didHitCar(obstacle)) {
        this.endGame();
      }
    });

    this.obstacles = this.obstacles.filter((obstacle) => {
      if (obstacle.shape.y < 625) {
        return true;
      }

      obstacle.shape.destroy();
      return false;
    });
  }

  private createRoad() {
    this.add.rectangle(450, 280, 560, 560, 0x222831, 1);
    this.add.rectangle(450, 280, 16, 560, 0xf6f3ee, 1);

    [300, 600].forEach((x) => {
      for (let y = 20; y < 560; y += 54) {
        this.add.rectangle(x, y, 8, 28, 0xf6f3ee, 0.82);
      }
    });

    this.add.rectangle(450, 74, 560, 92, 0x20232a, 0.2);
  }

  private createHud() {
    this.add
      .text(40, 26, this.minigame?.title ?? 'Dual Lane Drive', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        color: '#20232a',
      })
      .setOrigin(0, 0);

    this.add
      .text(40, 60, 'Move only the car whose lane is blocked.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#5f6673',
      })
      .setOrigin(0, 0);

    this.scoreText = this.add
      .text(820, 28, '0', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '38px',
        color: '#20232a',
      })
      .setOrigin(1, 0);

    this.rateText = this.add
      .text(820, 72, `${this.obstaclesPerMinute} obstacles/min`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#5f6673',
      })
      .setOrigin(1, 0);
  }

  private createCar(side: Side, laneIndex: number, color: number): CarState {
    const x = this.lanes[side][laneIndex];
    const car = this.add.container(x, 455);
    const shadow = this.add.rectangle(0, 10, 48, 70, 0x000000, 0.18).setOrigin(0.5);
    const body = this.add.rectangle(0, 0, 42, 66, color, 1).setOrigin(0.5);
    const cabin = this.add.rectangle(0, -8, 26, 26, 0xffffff, 0.72).setOrigin(0.5);
    const bumper = this.add.rectangle(0, -31, 34, 8, 0x20232a, 0.45).setOrigin(0.5);

    car.add([shadow, body, cabin, bumper]);

    return { side, laneIndex, body: car };
  }

  private createControlButton(
    x: number,
    y: number,
    label: string,
    keyHint: string,
    onPress: () => void,
  ) {
    const button = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, 150, 58, 0xffffff, 1).setOrigin(0.5);
    background.setStrokeStyle(2, 0xd8dce3, 1);
    const title = this.add
      .text(0, -10, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#20232a',
      })
      .setOrigin(0.5);
    const hint = this.add
      .text(0, 13, keyHint, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#5f6673',
      })
      .setOrigin(0.5);

    button.add([background, title, hint]);
    background.setInteractive({ useHandCursor: true });
    background.on('pointerdown', onPress);
  }

  private switchLane(side: Side) {
    if (this.isGameOver) {
      return;
    }

    const car = this.cars[side];
    car.laneIndex = car.laneIndex === 0 ? 1 : 0;

    this.tweens.add({
      targets: car.body,
      x: this.lanes[side][car.laneIndex],
      duration: 120,
      ease: 'Quad.easeOut',
    });
  }

  private handleKeyDown(event: KeyboardEvent) {
    const key = normalizeKeyboardEventKey(event.key);

    if (key === 'ENTER' || key === 'SPACE') {
      this.restartIfGameOver();
      return;
    }

    if (event.repeat || this.isGameOver) {
      return;
    }

    if (key === this.settings.leftKey) {
      this.switchLane('left');
      return;
    }

    if (key === this.settings.rightKey) {
      this.switchLane('right');
    }
  }

  private spawnObstacle() {
    if (this.isGameOver) {
      return;
    }

    const side: Side = Phaser.Math.Between(0, 1) === 0 ? 'left' : 'right';
    const laneIndex = Phaser.Math.Between(0, 1);
    const shape = this.add.rectangle(this.lanes[side][laneIndex], -42, 50, 58, 0xf0b429, 1);
    shape.setStrokeStyle(3, 0x20232a, 0.18);

    this.obstacles.push({ shape, laneIndex, scored: false, side });
  }

  private didHitCar(obstacle: Obstacle) {
    const car = this.cars[obstacle.side];

    return (
      obstacle.laneIndex === car.laneIndex &&
      Math.abs(obstacle.shape.y - car.body.y) < 58 &&
      Math.abs(obstacle.shape.x - car.body.x) < 44
    );
  }

  private addScore() {
    this.score += 1;
    this.obstaclesPerMinute = 30 + Math.floor(this.score / 4) * 6;
    this.speed = 185 + Math.floor(this.score / 6) * 8;
    this.scoreText?.setText(String(this.obstaclesPerMinute));
    this.rateText?.setText(`${this.obstaclesPerMinute} obstacles/min`);
  }

  private getSpawnDelay() {
    return 60000 / this.obstaclesPerMinute;
  }

  private updateObstacleSpawner(delta: number) {
    this.spawnElapsedMs += delta;

    while (this.spawnElapsedMs >= this.getSpawnDelay()) {
      this.spawnElapsedMs -= this.getSpawnDelay();
      this.spawnObstacle();
    }
  }

  private endGame() {
    this.isGameOver = true;

    this.statusText = this.add
      .text(
        450,
        258,
        `Peak pace ${this.obstaclesPerMinute} obstacles/min\nCleared ${this.score} obstacles\nPress Enter or Space to restart`,
        {
        align: 'center',
        backgroundColor: '#ffffff',
        color: '#20232a',
        fixedWidth: 430,
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        lineSpacing: 10,
        padding: { x: 18, y: 18 },
        },
      )
      .setOrigin(0.5);
  }

  private restartIfGameOver() {
    if (!this.isGameOver) {
      return;
    }

    this.statusText?.destroy();
    this.scene.restart({
      minigame: this.minigame,
      gameSettings: { sceneKey: 'DualLaneDriveScene', settings: this.settings },
    });
  }
}
