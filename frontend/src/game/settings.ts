export interface DualLaneDriveSettings {
  leftKey: string;
  rightKey: string;
}

export interface RhythmLanesSettings {
  keys: string[];
}

export type GameSettings =
  | { sceneKey: 'DualLaneDriveScene'; settings: DualLaneDriveSettings }
  | { sceneKey: 'RhythmLanesScene'; settings: RhythmLanesSettings }
  | { sceneKey: 'TrainingScene'; settings: Record<string, never> };
