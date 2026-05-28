import { defineStore } from 'pinia';
import type { GameSettings } from '../game/settings';
import type { MinigameDefinition } from '../minigames/types';

const SETTINGS_STORAGE_KEY = 'neuro-visual-training-game-settings';

type SettingsByGameId = Record<string, GameSettings>;

interface GameSettingsState {
  settingsByGameId: SettingsByGameId;
}

export const useGameSettingsStore = defineStore('gameSettings', {
  state: (): GameSettingsState => ({
    settingsByGameId: loadStoredSettings(),
  }),
  actions: {
    getSettingsForGame(minigame: MinigameDefinition) {
      const storedSettings = this.settingsByGameId[minigame.id];

      if (storedSettings?.sceneKey === minigame.sceneKey) {
        return storedSettings;
      }

      return minigame.createDefaultSettings();
    },
    saveSettings(gameId: string, settings: GameSettings) {
      this.settingsByGameId = {
        ...this.settingsByGameId,
        [gameId]: cloneSettings(settings),
      };
      saveStoredSettings(this.settingsByGameId);
    },
  },
});

function loadStoredSettings(): SettingsByGameId {
  const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (!rawSettings) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawSettings);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return parsed as SettingsByGameId;
  } catch {
    return {};
  }
}

function saveStoredSettings(settings: SettingsByGameId) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function cloneSettings(settings: GameSettings): GameSettings {
  return structuredClone(settings);
}
