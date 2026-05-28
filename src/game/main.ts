import Phaser from 'phaser';
import type { Minigame } from '../data/minigames';
import type { GameSettings } from './settings';
import { DualLaneDriveScene } from './scenes/DualLaneDriveScene';
import { RhythmLanesScene } from './scenes/RhythmLanesScene';
import { TrainingScene } from './scenes/TrainingScene';

export function createGame(
  parent: string | HTMLElement,
  minigame: Minigame,
  gameSettings: GameSettings,
) {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 900,
    height: 560,
    parent,
    backgroundColor: '#f6f3ee',
    scene: [DualLaneDriveScene, RhythmLanesScene, TrainingScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
  };

  const game = new Phaser.Game(config);
  game.scene.start(minigame.sceneKey, { minigame, gameSettings });

  return game;
}
