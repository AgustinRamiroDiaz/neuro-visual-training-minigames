import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { normalizeKeyboardEventKey } from '../inputKeys';
import type { GameSettings, RhythmLanesSettings } from '../settings';
import type { Minigame } from '../../data/minigames';

interface RhythmLane {
  key: string;
  x: number;
}

interface RhythmNote {
  container: Phaser.GameObjects.Container;
  laneIndex: number;
  scored: boolean;
}

export class RhythmLanesScene extends Phaser.Scene {
  private readonly hitWindow = 44;
  private lanes: RhythmLane[] = [];
  private minigame?: Minigame;
  private settings: RhythmLanesSettings = {
    keys: ['A', 'S', 'K', 'L'],
  };
  private notes: RhythmNote[] = [];
  private score = 0;
  private streak = 0;
  private misses = 0;
  private notesPerMinute = 44;
  private fallSpeed = 190;
  private spawnElapsedMs = 0;
  private isGameOver = false;
  private scoreText?: Phaser.GameObjects.Text;
  private streakText?: Phaser.GameObjects.Text;
  private missesText?: Phaser.GameObjects.Text;
  private paceText?: Phaser.GameObjects.Text;
  private feedbackText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'RhythmLanesScene' });
  }

  init(data: { minigame?: Minigame; gameSettings?: GameSettings }) {
    this.minigame = data.minigame;
    this.settings =
      data.gameSettings?.sceneKey === 'RhythmLanesScene'
        ? data.gameSettings.settings
        : { keys: ['A', 'S', 'K', 'L'] };
    this.lanes = [];
    this.notes = [];
    this.score = 0;
    this.streak = 0;
    this.misses = 0;
    this.notesPerMinute = 44;
    this.fallSpeed = 190;
    this.spawnElapsedMs = 0;
    this.isGameOver = false;
  }

  create() {
    this.cameras.main.setBackgroundColor('#f6f3ee');
    this.lanes = this.createLanes(this.settings.keys);
    this.createStage();
    this.createHud();
    this.createControls();

    EventBus.emit('current-scene-ready', this);
  }

  update(_: number, delta: number) {
    if (this.isGameOver) {
      return;
    }

    this.updateSpawner(delta);
    this.updateNotes(delta);
  }

  private createStage() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const stageWidth = this.getStageWidth();
    const stageHeight = this.scale.height;
    const targetY = this.getTargetY();

    this.add.rectangle(centerX, centerY, stageWidth, stageHeight, 0x20232a, 1);

    this.lanes.forEach((lane, index) => {
      this.add.rectangle(
        lane.x,
        centerY,
        this.getLaneWidth(),
        stageHeight,
        index % 2 === 0 ? 0x27303b : 0x222a34,
        1,
      );
      this.add.line(
        lane.x - this.getLaneWidth() / 2,
        centerY,
        0,
        -stageHeight / 2,
        0,
        stageHeight / 2,
        0xf6f3ee,
        0.12,
      );
      this.add
        .text(lane.x, targetY + 2, lane.key, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '30px',
          color: '#20232a',
        })
        .setOrigin(0.5);
    });

    this.add.rectangle(centerX, targetY, stageWidth, 74, 0xf6f3ee, 0.96);
    this.add.rectangle(centerX, targetY, stageWidth, 4, 0x5b7cfa, 1);
    this.add.rectangle(centerX, 74, stageWidth, 92, 0xf6f3ee, 0.1);
  }

  private createHud() {
    this.add
      .text(36, 26, this.minigame?.title ?? 'Rhythm Lanes', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        color: '#20232a',
      })
      .setOrigin(0, 0);

    this.add
      .text(36, 60, 'Press each key when it reaches the instrument lane.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#5f6673',
      })
      .setOrigin(0, 0);

    this.scoreText = this.add
      .text(this.scale.width - 40, 24, '0', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '38px',
        color: '#20232a',
      })
      .setOrigin(1, 0);

    this.streakText = this.add
      .text(this.scale.width - 40, 70, 'Streak 0', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#5f6673',
      })
      .setOrigin(1, 0);

    this.missesText = this.add
      .text(this.scale.width - 40, 94, 'Misses 0/8', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#5f6673',
      })
      .setOrigin(1, 0);

    this.paceText = this.add
      .text(this.scale.width - 40, 118, `${this.notesPerMinute} notes/min`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#5f6673',
      })
      .setOrigin(1, 0);

    this.feedbackText = this.add
      .text(this.scale.width / 2, this.scale.height - 52, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#20232a',
      })
      .setOrigin(0.5);
  }

  private createControls() {
    this.lanes.forEach((lane, index) => {
      this.createButton(lane.x, this.getControlY(), lane.key, () => this.tryHit(index));
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.handleKeyDown(event));
  }

  private createButton(x: number, y: number, label: string, onPress: () => void) {
    const button = this.add.rectangle(
      x,
      y,
      Math.max(42, Math.min(74, this.getLaneWidth() - 12)),
      48,
      0xffffff,
      1,
    );
    button.setStrokeStyle(2, 0xd8dce3, 1);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', onPress);

    this.add
      .text(x, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#20232a',
      })
      .setOrigin(0.5);
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

    const laneIndex = this.lanes.findIndex((lane) => lane.key === key);

    if (laneIndex !== -1) {
      this.tryHit(laneIndex);
    }
  }

  private createLanes(keys: string[]) {
    const laneWidth = this.getLaneWidth(keys.length);
    const startX = this.scale.width / 2 - ((keys.length - 1) * laneWidth) / 2;

    return keys.map((key, index) => ({
      key,
      x: startX + index * laneWidth,
    }));
  }

  private getLaneWidth(laneCount = this.lanes.length) {
    return Math.min(112, this.getStageWidth() / laneCount);
  }

  private getStageWidth() {
    return Math.min(760, this.scale.width * 0.66);
  }

  private getTargetY() {
    return this.scale.height - 150;
  }

  private getControlY() {
    return this.scale.height - 54;
  }

  private updateSpawner(delta: number) {
    this.spawnElapsedMs += delta;

    while (this.spawnElapsedMs >= this.getSpawnDelay()) {
      this.spawnElapsedMs -= this.getSpawnDelay();
      this.spawnNote();
    }
  }

  private updateNotes(delta: number) {
    const distance = (this.fallSpeed * delta) / 1000;

    this.notes.forEach((note) => {
      note.container.y += distance;

      if (!note.scored && note.container.y > this.getTargetY() + this.hitWindow) {
        note.scored = true;
        this.registerMiss('Late');
        note.container.destroy();
      }
    });

    this.notes = this.notes.filter(
      (note) => note.container.active && note.container.y < this.scale.height + 80,
    );
  }

  private spawnNote() {
    const laneIndex = Phaser.Math.Between(0, this.lanes.length - 1);
    const lane = this.lanes[laneIndex];
    const container = this.add.container(lane.x, -36);
    const note = this.add.rectangle(0, 0, 64, 48, 0x5b7cfa, 1).setOrigin(0.5);
    note.setStrokeStyle(3, 0xffffff, 0.72);
    const label = this.add
      .text(0, 0, lane.key, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    container.add([note, label]);
    this.notes.push({ container, laneIndex, scored: false });
  }

  private tryHit(laneIndex: number) {
    if (this.isGameOver) {
      return;
    }

    const nearest = this.notes
      .filter((note) => !note.scored && note.laneIndex === laneIndex)
      .sort(
        (a, b) =>
          Math.abs(a.container.y - this.getTargetY()) - Math.abs(b.container.y - this.getTargetY()),
      )[0];

    if (!nearest || Math.abs(nearest.container.y - this.getTargetY()) > this.hitWindow) {
      this.registerMiss('Miss');
      return;
    }

    const distanceFromTarget = Math.abs(nearest.container.y - this.getTargetY());
    const quality = distanceFromTarget < 16 ? 'Perfect' : 'Good';
    const points = quality === 'Perfect' ? 120 : 80;

    nearest.scored = true;
    nearest.container.destroy();
    this.score += points + this.streak * 2;
    this.streak += 1;
    this.notesPerMinute = 44 + Math.floor(this.streak / 6) * 4 + Math.floor(this.score / 1200) * 2;
    this.fallSpeed = 190 + Math.floor(this.score / 900) * 10;
    this.updateHud();
    this.showFeedback(quality);
  }

  private registerMiss(label: string) {
    this.streak = 0;
    this.misses += 1;
    this.updateHud();
    this.showFeedback(label);

    if (this.misses >= 8) {
      this.endGame();
    }
  }

  private updateHud() {
    this.scoreText?.setText(String(this.score));
    this.streakText?.setText(`Streak ${this.streak}`);
    this.missesText?.setText(`Misses ${this.misses}/8`);
    this.paceText?.setText(`${this.notesPerMinute} notes/min`);
  }

  private showFeedback(label: string) {
    this.feedbackText?.setText(label);
    this.tweens.killTweensOf(this.feedbackText);
    this.feedbackText?.setAlpha(1);
    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      duration: 450,
      ease: 'Quad.easeOut',
    });
  }

  private getSpawnDelay() {
    return 60000 / this.notesPerMinute;
  }

  private endGame() {
    this.isGameOver = true;
    EventBus.emit('game-finished', {
      metadata: {
        score: this.score,
        misses: this.misses,
        finalStreak: this.streak,
        peakNotesPerMinute: this.notesPerMinute,
      },
    });

    this.statusText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        `Score ${this.score}\nPeak pace ${this.notesPerMinute} notes/min\nPress Enter or Space to restart`,
        {
          align: 'center',
          backgroundColor: '#ffffff',
          color: '#20232a',
          fixedWidth: 420,
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
      gameSettings: { sceneKey: 'RhythmLanesScene', settings: this.settings },
    });
  }
}
