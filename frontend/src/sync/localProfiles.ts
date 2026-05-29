import type { CloudPreferences } from '../api/cloudSync';
import {
  loadAnonymousPlayHistory,
  removePlayHistory,
  saveAnonymousPlayHistory,
  type PlayHistoryRecord,
} from '../history/playHistory';
import {
  loadAnonymousSettings,
  removeStoredSettings,
  saveAnonymousSettings,
  type SettingsByGameId,
} from '../stores/gameSettingsStore';

export interface LocalTrainingState {
  history: PlayHistoryRecord[];
  gameSettings: SettingsByGameId;
}

export function getCurrentTrainingState(
  history: PlayHistoryRecord[],
  preferences: CloudPreferences,
): LocalTrainingState {
  return {
    history,
    gameSettings: preferences.gameSettings ?? {},
  };
}

export function hasTrainingState(state: LocalTrainingState) {
  return state.history.length > 0 || Object.keys(state.gameSettings).length > 0;
}

export function saveAnonymousTrainingState(state: LocalTrainingState) {
  saveAnonymousPlayHistory(state.history);
  saveAnonymousSettings(state.gameSettings);
}

export function loadAnonymousTrainingState(): LocalTrainingState {
  return {
    history: loadAnonymousPlayHistory(),
    gameSettings: loadAnonymousSettings(),
  };
}

export function clearActiveTrainingState() {
  removePlayHistory();
  removeStoredSettings();
}

export function mergePreferences(
  cloudPreferences: CloudPreferences,
  localPreferences: CloudPreferences,
): CloudPreferences {
  return {
    gameSettings: {
      ...(cloudPreferences.gameSettings ?? {}),
      ...(localPreferences.gameSettings ?? {}),
    },
  };
}

export function mergeHistory(cloudHistory: PlayHistoryRecord[], localHistory: PlayHistoryRecord[]) {
  const recordsById = new Map<string, PlayHistoryRecord>();

  [...cloudHistory, ...localHistory].forEach((record) => {
    recordsById.set(record.id, record);
  });

  return [...recordsById.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
