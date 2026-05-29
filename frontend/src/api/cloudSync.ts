import type { GameSettings } from '../game/settings';
import type { PlayHistoryRecord, PlayMetadata } from '../history/playHistory';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export interface CloudUser {
  id: string;
  username: string;
  display_name: string | null;
  created_at: string;
}

export interface CloudPreferences {
  gameSettings?: Record<string, GameSettings>;
}

interface CloudHistoryRecord {
  id: string;
  client_id: string;
  user_id: string;
  timestamp: string;
  game_id: string;
  game_name: string;
  metadata: PlayMetadata;
}

interface SyncResponse {
  user: CloudUser;
  preferences: CloudPreferences;
  history: CloudHistoryRecord[];
}

export async function createCloudUser(username: string, displayName?: string) {
  return request<CloudUser>('/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      display_name: displayName,
    }),
  });
}

export async function loginCloudUser(username: string) {
  return request<CloudUser>('/login', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function saveCloudPreferences(userId: string, preferences: CloudPreferences) {
  return request(`/users/${userId}/preferences`, {
    method: 'PUT',
    body: JSON.stringify({ preferences }),
  });
}

export async function replaceCloudHistory(userId: string, records: PlayHistoryRecord[]) {
  const history = await request<CloudHistoryRecord[]>(`/users/${userId}/history`, {
    method: 'PUT',
    body: JSON.stringify(
      records.map((record) => ({
        id: record.id,
        timestamp: record.timestamp,
        game_id: record.gameId,
        game_name: record.gameName,
        metadata: record.metadata,
      })),
    ),
  });

  return history.map(mapCloudHistoryRecord);
}

export async function getCloudSync(userId: string) {
  const sync = await request<SyncResponse>(`/users/${userId}/sync`);

  return {
    user: sync.user,
    preferences: sync.preferences,
    history: sync.history.map(mapCloudHistoryRecord),
  };
}

async function request<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => null);
    const message = getErrorMessage(errorBody) ?? `Request failed with ${response.status}`;

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function getErrorMessage(value: unknown) {
  if (!value || typeof value !== 'object' || !('error' in value)) {
    return null;
  }

  const error = value.error;

  return typeof error === 'string' ? error : null;
}

function mapCloudHistoryRecord(record: CloudHistoryRecord): PlayHistoryRecord {
  return {
    id: record.client_id,
    timestamp: record.timestamp,
    gameId: record.game_id,
    gameName: record.game_name,
    metadata: record.metadata,
  };
}
