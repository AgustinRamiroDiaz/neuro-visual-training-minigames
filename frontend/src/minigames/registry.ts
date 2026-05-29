import type { MinigameDefinition, SkillArea } from './types';
import DualLaneDriveSetup from './dual-lane-drive/DualLaneDriveSetup.vue';
import RhythmLanesSetup from './rhythm-lanes/RhythmLanesSetup.vue';

export const minigames: MinigameDefinition[] = [
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
    setupComponent: DualLaneDriveSetup,
    createDefaultSettings: () => ({
      sceneKey: 'DualLaneDriveScene',
      settings: {
        leftKey: 'A',
        rightKey: 'D',
      },
    }),
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
    setupComponent: RhythmLanesSetup,
    createDefaultSettings: () => ({
      sceneKey: 'RhythmLanesScene',
      settings: {
        keys: ['A', 'S', 'K', 'L'],
      },
    }),
  },
];

export const skillAreas: ('All' | SkillArea)[] = [
  'All',
  'Visual Search',
  'Reaction',
  'Tracking',
  'Memory',
  'Coordination',
];
