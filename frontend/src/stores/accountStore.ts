import { defineStore } from 'pinia';
import {
  createCloudUser,
  getCloudSync,
  loginCloudUser,
  replaceCloudHistory,
  saveCloudPreferences,
  type CloudPreferences,
  type CloudUser,
} from '../api/cloudSync';
import type { PlayHistoryRecord } from '../history/playHistory';

const ACCOUNT_STORAGE_KEY = 'neuro-visual-training-account';

interface AccountState {
  user: CloudUser | null;
  pendingSync: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  syncError: string | null;
}

export const useAccountStore = defineStore('account', {
  state: (): AccountState => ({
    user: loadStoredAccount(),
    pendingSync: false,
    syncStatus: 'idle',
    syncError: null,
  }),
  actions: {
    async createAccount(username: string, displayName?: string) {
      this.syncStatus = 'syncing';
      this.syncError = null;

      try {
        this.user = await createCloudUser(username, displayName);
        saveStoredAccount(this.user);
        this.syncStatus = 'synced';
      } catch (error) {
        this.syncStatus = 'error';
        this.syncError = getErrorMessage(error);
        throw error;
      }
    },
    async login(username: string) {
      this.syncStatus = 'syncing';
      this.syncError = null;

      try {
        this.user = await loginCloudUser(username);
        saveStoredAccount(this.user);
        this.syncStatus = 'synced';
      } catch (error) {
        this.syncStatus = 'error';
        this.syncError = getErrorMessage(error);
        throw error;
      }
    },
    logout() {
      this.user = null;
      this.pendingSync = false;
      this.syncStatus = 'idle';
      this.syncError = null;
      localStorage.removeItem(ACCOUNT_STORAGE_KEY);
    },
    markPendingSync() {
      if (!this.user) {
        return;
      }

      this.pendingSync = true;

      if (!navigator.onLine) {
        this.syncStatus = 'offline';
        this.syncError = null;
      }
    },
    async saveToCloud(preferences: CloudPreferences, history: PlayHistoryRecord[]) {
      if (!this.user) {
        return;
      }

      if (!navigator.onLine) {
        this.pendingSync = true;
        this.syncStatus = 'offline';
        this.syncError = null;
        return;
      }

      this.syncStatus = 'syncing';
      this.syncError = null;

      try {
        await saveCloudPreferences(this.user.id, preferences);
        await replaceCloudHistory(this.user.id, history);
        this.pendingSync = false;
        this.syncStatus = 'synced';
      } catch (error) {
        this.pendingSync = true;
        this.syncStatus = 'error';
        this.syncError = getErrorMessage(error);
      }
    },
    async loadFromCloud() {
      if (!this.user) {
        return null;
      }

      if (!navigator.onLine) {
        this.pendingSync = true;
        this.syncStatus = 'offline';
        this.syncError = null;
        return null;
      }

      this.syncStatus = 'syncing';
      this.syncError = null;

      try {
        const sync = await getCloudSync(this.user.id);
        this.user = sync.user;
        saveStoredAccount(sync.user);
        this.syncStatus = 'synced';

        return sync;
      } catch (error) {
        this.syncStatus = 'error';
        this.syncError = getErrorMessage(error);
        return null;
      }
    },
  },
});

function loadStoredAccount() {
  const rawAccount = localStorage.getItem(ACCOUNT_STORAGE_KEY);

  if (!rawAccount) {
    return null;
  }

  try {
    const account: unknown = JSON.parse(rawAccount);

    if (!account || typeof account !== 'object' || typeof account.id !== 'string') {
      return null;
    }

    return isCloudUser(account) ? account : null;
  } catch {
    return null;
  }
}

function saveStoredAccount(account: CloudUser) {
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Cloud sync failed';
}

function isCloudUser(value: unknown): value is CloudUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as Partial<CloudUser>;

  return (
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    (user.display_name === null || typeof user.display_name === 'string') &&
    typeof user.created_at === 'string'
  );
}
