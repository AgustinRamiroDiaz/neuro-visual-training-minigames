export type SkillArea = 'Visual Search' | 'Reaction' | 'Tracking' | 'Memory';

export interface Minigame {
  id: string;
  title: string;
  summary: string;
  skillArea: SkillArea;
  difficulty: 'Starter' | 'Focused' | 'Advanced';
  duration: string;
  preview: {
    pattern: 'targets' | 'pulse' | 'orbit' | 'grid';
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
    id: 'contrast-catch',
    title: 'Contrast Catch',
    summary: 'Find the odd target in a field of similar shapes before the timer fades.',
    skillArea: 'Visual Search',
    difficulty: 'Starter',
    duration: '2 min',
    preview: {
      pattern: 'targets',
      accent: '#2f7dff',
    },
  },
  {
    id: 'flash-focus',
    title: 'Flash Focus',
    summary: 'Tap the signal as soon as it appears to train fast visual response.',
    skillArea: 'Reaction',
    difficulty: 'Focused',
    duration: '90 sec',
    preview: {
      pattern: 'pulse',
      accent: '#e24d68',
    },
  },
  {
    id: 'smooth-pursuit',
    title: 'Smooth Pursuit',
    summary: 'Track a moving point through changing paths without losing attention.',
    skillArea: 'Tracking',
    difficulty: 'Focused',
    duration: '3 min',
    preview: {
      pattern: 'orbit',
      accent: '#188b7b',
    },
  },
  {
    id: 'sequence-scan',
    title: 'Sequence Scan',
    summary: 'Remember and repeat brief visual sequences across a shifting grid.',
    skillArea: 'Memory',
    difficulty: 'Advanced',
    duration: '4 min',
    preview: {
      pattern: 'grid',
      accent: '#8f5cdd',
    },
  },
];
