export type SkillArea = 'Visual Search' | 'Reaction' | 'Tracking' | 'Memory' | 'Coordination';

export interface Minigame {
  id: string;
  title: string;
  summary: string;
  skillArea: SkillArea;
  difficulty: 'Starter' | 'Focused' | 'Advanced';
  duration: string;
  sceneKey: 'DualLaneDriveScene' | 'RhythmLanesScene' | 'TrainingScene';
  preview: {
    pattern: 'targets' | 'pulse' | 'orbit' | 'grid' | 'dual-lane' | 'rhythm-lanes';
    accent: string;
  };
}

export const skillAreas: Array<'All' | SkillArea> = [
  'All',
  'Visual Search',
  'Reaction',
  'Tracking',
  'Memory',
  'Coordination',
];

export const minigames: Minigame[] = [
  {
    id: 'dual-lane-drive',
    title: 'Dual Lane Drive',
    summary: 'Control two cars at once, switching the correct car away from incoming lane obstacles.',
    skillArea: 'Reaction',
    difficulty: 'Focused',
    duration: '2 min',
    sceneKey: 'DualLaneDriveScene',
    preview: {
      pattern: 'dual-lane',
      accent: '#f0b429',
    },
  },
  {
    id: 'rhythm-lanes',
    title: 'Rhythm Lanes',
    summary: 'Press the matching keys as button prompts reach the instrument lane.',
    skillArea: 'Coordination',
    difficulty: 'Starter',
    duration: '2 min',
    sceneKey: 'RhythmLanesScene',
    preview: {
      pattern: 'rhythm-lanes',
      accent: '#5b7cfa',
    },
  },
];
