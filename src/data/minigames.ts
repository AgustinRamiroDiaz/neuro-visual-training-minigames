export type SkillArea = 'Visual Search' | 'Reaction' | 'Tracking' | 'Memory';

export interface Minigame {
  id: string;
  title: string;
  summary: string;
  skillArea: SkillArea;
  difficulty: 'Starter' | 'Focused' | 'Advanced';
  duration: string;
  sceneKey: 'DualLaneDriveScene' | 'TrainingScene';
  preview: {
    pattern: 'targets' | 'pulse' | 'orbit' | 'grid' | 'dual-lane';
    accent: string;
  };
}

export const skillAreas: Array<'All' | SkillArea> = [
  'All',
  'Visual Search',
  'Reaction',
  'Tracking',
  'Memory',
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
];
