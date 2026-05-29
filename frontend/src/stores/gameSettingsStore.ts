import { defineStore } from 'pinia';
import type { GameSettings } from '../game/settings';
import type { MinigameDefinition } from '../minigames/types';

const SETTINGS_STORAGE_KEY = 'neuro-visual-training-game-settings';
const ANONYMOUS_SETTINGS_STORAGE_KEY = `${SETTINGS_STORAGE_KEY}:anonymous`;

export type SettingsByGameId = Record<string, GameSettings>;

interface GameSettingsState {
  settingsByGameId: SettingsByGameId;
}

export const useGameSettingsStore = defineStore('gameSettings', {
  state: (): GameSettingsState => ({
    settingsByGameId: loadStoredSettings(),
  }),
  actions: {
    getCloudPreferences() {
      return {
        gameSettings: this.settingsByGameId,
      };
    },
    replaceFromCloud(settingsByGameId: SettingsByGameId = {}) {
      this.settingsByGameId = settingsByGameId;
      saveStoredSettings(this.settingsByGameId);
    },
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

export function loadStoredSettings(storageKey = SETTINGS_STORAGE_KEY): SettingsByGameId {
  const rawSettings = localStorage.getItem(storageKey);

  if (!rawSettings) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(rawSettings);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return parsed as SettingsByGameId;
  } catch {
    return {};
  }
}

export function saveStoredSettings(settings: SettingsByGameId, storageKey = SETTINGS_STORAGE_KEY) {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}

export function removeStoredSettings(storageKey = SETTINGS_STORAGE_KEY) {
  localStorage.removeItem(storageKey);
}

export function saveAnonymousSettings(settings: SettingsByGameId) {
  saveStoredSettings(settings, ANONYMOUS_SETTINGS_STORAGE_KEY);
}

export function loadAnonymousSettings() {
  return loadStoredSettings(ANONYMOUS_SETTINGS_STORAGE_KEY);
}

function cloneSettings(settings: GameSettings): GameSettings {
  return structuredClone(settings);
}
