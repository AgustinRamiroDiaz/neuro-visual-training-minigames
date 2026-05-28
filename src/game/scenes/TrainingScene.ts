import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import type { Minigame } from '../../data/minigames';

export class TrainingScene extends Phaser.Scene {
  private minigame?: Minigame;

  constructor() {
    super({ key: 'TrainingScene' });
  }

  init(data: { minigame?: Minigame }) {
    this.minigame = data.minigame;
  }

  create() {
    const gameTitle = this.minigame?.title ?? 'Training Session';
    const skillArea = this.minigame?.skillArea ?? 'Visual Training';
    const accent = this.minigame?.preview.accent ?? '#2f7dff';

    this.cameras.main.setBackgroundColor('#f6f3ee');

    const { width, height } = this.scale;
    this.add
      .text(width / 2, 72, gameTitle, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        color: '#20232a',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 112, skillArea, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#5f6673',
      })
      .setOrigin(0.5);

    this.createDemoTarget(width / 2, height / 2, accent);

    this.add
      .text(width / 2, height - 72, 'Phaser play space ready', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#3b414d',
      })
      .setOrigin(0.5);

    EventBus.emit('current-scene-ready', this);
  }

  private createDemoTarget(x: number, y: number, accent: string) {
    const ring = this.add.circle(x, y, 92, 0xffffff, 1);
    ring.setStrokeStyle(2, 0xd8dce3, 1);

    const target = this.add.circle(x, y, 34, Phaser.Display.Color.HexStringToColor(accent).color, 1);

    this.tweens.add({
      targets: target,
      scale: { from: 0.82, to: 1.18 },
      duration: 850,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: ring,
      angle: 360,
      duration: 2800,
      repeat: -1,
    });
  }
}
