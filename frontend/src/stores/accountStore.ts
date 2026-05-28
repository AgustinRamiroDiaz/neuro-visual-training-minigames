import { defineStore } from 'pinia';
import {
  createCloudUser,
  getCloudSync,
  replaceCloudHistory,
  saveCloudPreferences,
  type CloudPreferences,
  type CloudUser,
} from '../api/cloudSync';
import type { PlayHistoryRecord } from '../history/playHistory';

const ACCOUNT_STORAGE_KEY = 'neuro-visual-training-account';

interface AccountState {
  user: CloudUser | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  syncError: string | null;
}

export const useAccountStore = defineStore('account', {
  state: (): AccountState => ({
    user: loadStoredAccount(),
    syncStatus: 'idle',
    syncError: null,
  }),
  actions: {
    async createAccount(username: string) {
      this.syncStatus = 'syncing';
      this.syncError = null;

      try {
        this.user = await createCloudUser(username);
        saveStoredAccount(this.user);
        this.syncStatus = 'synced';
      } catch (error) {
        this.syncStatus = 'error';
        this.syncError = getErrorMessage(error);
        throw error;
      }
    },
    async saveToCloud(preferences: CloudPreferences, history: PlayHistoryRecord[]) {
      if (!this.user) {
        return;
      }

      this.syncStatus = 'syncing';
      this.syncError = null;

      try {
        await saveCloudPreferences(this.user.id, preferences);
        await replaceCloudHistory(this.user.id, history);
        this.syncStatus = 'synced';
      } catch (error) {
        this.syncStatus = 'error';
        this.syncError = getErrorMessage(error);
      }
    },
    async loadFromCloud() {
      if (!this.user) {
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
    const account = JSON.parse(rawAccount);

    if (!account || typeof account !== 'object' || typeof account.id !== 'string') {
      return null;
    }

    return account as CloudUser;
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
