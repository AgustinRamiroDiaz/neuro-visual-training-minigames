import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useAccountStore } from '../stores/accountStore';
import { useGameSettingsStore } from '../stores/gameSettingsStore';
import { useHistoryStore } from '../stores/historyStore';
import {
  clearActiveTrainingState,
  loadAnonymousTrainingState,
  mergeHistory,
  mergePreferences,
} from './localProfiles';

interface CloudSyncOptions {
  start?: boolean;
}

export function useCloudSync(options: CloudSyncOptions = {}) {
  const accountStore = useAccountStore();
  const settingsStore = useGameSettingsStore();
  const historyStore = useHistoryStore();
  const syncTimer = ref<number | null>(null);
  let isApplyingCloudState = false;

  const syncLabel = computed(() => {
    if (accountStore.syncStatus === 'syncing') {
      return 'Syncing';
    }

    if (accountStore.syncStatus === 'offline') {
      return 'Offline';
    }

    if (accountStore.syncStatus === 'error') {
      return 'Waiting to sync';
    }

    return accountStore.pendingSync ? 'Pending sync' : 'Synced';
  });

  const syncClass = computed(() => ({
    error: accountStore.syncStatus === 'error',
    offline: accountStore.syncStatus === 'offline',
    syncing: accountStore.syncStatus === 'syncing',
    synced: accountStore.syncStatus === 'synced' && !accountStore.pendingSync,
  }));

  const logoutAndRestoreAnonymousState = () => {
    const anonymousState = loadAnonymousTrainingState();

    accountStore.logout();
    clearActiveTrainingState();
    settingsStore.replaceFromCloud(anonymousState.gameSettings);
    historyStore.replaceRecords(anonymousState.history);
  };

  if (options.start) {
    const localSyncSnapshot = computed(() =>
      JSON.stringify({
        history: historyStore.records,
        preferences: settingsStore.getCloudPreferences(),
      }),
    );

    const scheduleSync = () => {
      if (!accountStore.user || isApplyingCloudState) {
        return;
      }

      accountStore.markPendingSync();

      if (syncTimer.value !== null) {
        window.clearTimeout(syncTimer.value);
      }

      syncTimer.value = window.setTimeout(() => {
        syncTimer.value = null;
        void pushLocalToCloud();
      }, 900);
    };

    const pushLocalToCloud = async () => {
      await accountStore.saveToCloud(settingsStore.getCloudPreferences(), historyStore.records);
    };

    const syncCloudAndLocal = async () => {
      if (!accountStore.user) {
        return;
      }

      if (!navigator.onLine) {
        accountStore.markPendingSync();
        return;
      }

      const localPreferences = settingsStore.getCloudPreferences();
      const localHistory = [...historyStore.records];
      isApplyingCloudState = true;

      try {
        const sync = await accountStore.loadFromCloud();

        if (!sync) {
          return;
        }

        const mergedPreferences = mergePreferences(sync.preferences, localPreferences);
        const mergedHistory = mergeHistory(sync.history, localHistory);

        settingsStore.replaceFromCloud(mergedPreferences.gameSettings);
        historyStore.replaceRecords(mergedHistory);
        await accountStore.saveToCloud(mergedPreferences, mergedHistory);
      } finally {
        isApplyingCloudState = false;
      }
    };

    const handleOnline = () => {
      void syncCloudAndLocal();
    };

    const handleOffline = () => {
      accountStore.markPendingSync();
    };

    watch(localSyncSnapshot, () => {
      scheduleSync();
    });

    onMounted(() => {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      void syncCloudAndLocal();
    });

    onBeforeUnmount(() => {
      if (syncTimer.value !== null) {
        window.clearTimeout(syncTimer.value);
      }

      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  }

  return {
    logoutAndRestoreAnonymousState,
    syncClass,
    syncLabel,
  };
}
