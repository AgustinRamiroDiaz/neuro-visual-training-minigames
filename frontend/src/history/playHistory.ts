import type { Minigame } from '../minigames/types';

const HISTORY_STORAGE_KEY = 'neuro-visual-training-play-history';
const ANONYMOUS_HISTORY_STORAGE_KEY = `${HISTORY_STORAGE_KEY}:anonymous`;

export type PlayMetadataValue =
  | string
  | number
  | boolean
  | null
  | PlayMetadataValue[]
  | { [key: string]: PlayMetadataValue };

export type PlayMetadata = Record<string, PlayMetadataValue>;

export interface GameFinishedPayload {
  metadata?: PlayMetadata;
}

export interface PlayHistoryRecord {
  id: string;
  timestamp: string;
  gameId: string;
  gameName: string;
  metadata: PlayMetadata;
}

export function createPlayHistoryRecord(
  minigame: Minigame,
  payload: GameFinishedPayload = {},
): PlayHistoryRecord {
  const timestamp = new Date().toISOString();

  return {
    id: `${minigame.id}-${timestamp}-${crypto.randomUUID()}`,
    timestamp,
    gameId: minigame.id,
    gameName: minigame.title,
    metadata: payload.metadata ?? {},
  };
}

export function loadPlayHistory(storageKey = HISTORY_STORAGE_KEY): PlayHistoryRecord[] {
  const rawHistory = localStorage.getItem(storageKey);

  if (!rawHistory) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawHistory);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isPlayHistoryRecord);
  } catch {
    return [];
  }
}

export function savePlayHistory(records: PlayHistoryRecord[], storageKey = HISTORY_STORAGE_KEY) {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

export function removePlayHistory(storageKey = HISTORY_STORAGE_KEY) {
  localStorage.removeItem(storageKey);
}

export function saveAnonymousPlayHistory(records: PlayHistoryRecord[]) {
  savePlayHistory(records, ANONYMOUS_HISTORY_STORAGE_KEY);
}

export function loadAnonymousPlayHistory() {
  return loadPlayHistory(ANONYMOUS_HISTORY_STORAGE_KEY);
}

function isPlayHistoryRecord(value: unknown): value is PlayHistoryRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<PlayHistoryRecord>;

  return (
    typeof record.id === 'string' &&
    typeof record.timestamp === 'string' &&
    typeof record.gameId === 'string' &&
    typeof record.gameName === 'string' &&
    isMetadata(record.metadata)
  );
}

function isMetadata(value: unknown): value is PlayMetadata {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
