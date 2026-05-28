import type { Minigame } from '../minigames/types';

const HISTORY_STORAGE_KEY = 'neuro-visual-training-play-history';

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

export function loadPlayHistory(): PlayHistoryRecord[] {
  const rawHistory = localStorage.getItem(HISTORY_STORAGE_KEY);

  if (!rawHistory) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawHistory);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isPlayHistoryRecord);
  } catch {
    return [];
  }
}

export function savePlayHistory(records: PlayHistoryRecord[]) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
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
