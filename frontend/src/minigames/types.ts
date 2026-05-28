import type { Component } from 'vue';
import type { GameSettings } from '../game/settings';

export type SkillArea = 'Visual Search' | 'Reaction' | 'Tracking' | 'Memory' | 'Coordination';

export type SceneKey = 'DualLaneDriveScene' | 'RhythmLanesScene' | 'TrainingScene';

export type PreviewPattern =
  | 'targets'
  | 'pulse'
  | 'orbit'
  | 'grid'
  | 'dual-lane'
  | 'rhythm-lanes';

export interface Minigame {
  id: string;
  title: string;
  summary: string;
  skillArea: SkillArea;
  difficulty: 'Starter' | 'Focused' | 'Advanced';
  duration: string;
  sceneKey: SceneKey;
  preview: {
    pattern: PreviewPattern;
    accent: string;
  };
}

export interface MinigameDefinition extends Minigame {
  setupComponent: Component;
  createDefaultSettings: () => GameSettings;
}
