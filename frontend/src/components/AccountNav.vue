<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CloudPreferences } from '../api/cloudSync';
import type { PlayHistoryRecord } from '../history/playHistory';
import { useAccountStore } from '../stores/accountStore';
import { useGameSettingsStore } from '../stores/gameSettingsStore';
import { useHistoryStore } from '../stores/historyStore';

const accountStore = useAccountStore();
const settingsStore = useGameSettingsStore();
const historyStore = useHistoryStore();
const syncTimer = ref<number | null>(null);
let isApplyingCloudState = false;

const localSyncSnapshot = computed(() =>
  JSON.stringify({
    history: historyStore.records,
    preferences: settingsStore.getCloudPreferences(),
  }),
);

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
    pushLocalToCloud();
  }, 900);
};

const pushLocalToCloud = () => {
  accountStore.saveToCloud(settingsStore.getCloudPreferences(), historyStore.records);
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
  syncCloudAndLocal();
};

const handleOffline = () => {
  accountStore.markPendingSync();
};

watch(
  () => accountStore.user?.id,
  (userId) => {
    if (userId) {
      syncCloudAndLocal();
    }
  },
  { immediate: true },
);

watch(localSyncSnapshot, () => {
  scheduleSync();
});

onMounted(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
});

onBeforeUnmount(() => {
  if (syncTimer.value !== null) {
    window.clearTimeout(syncTimer.value);
  }

  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});

function mergePreferences(
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

function mergeHistory(cloudHistory: PlayHistoryRecord[], localHistory: PlayHistoryRecord[]) {
  const recordsById = new Map<string, PlayHistoryRecord>();

  [...cloudHistory, ...localHistory].forEach((record) => {
    recordsById.set(record.id, record);
  });

  return [...recordsById.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
</script>

<template>
  <nav class="account-nav" aria-label="Account">
    <template v-if="accountStore.user">
      <span class="account-name">{{ accountStore.user.username }}</span>
      <span class="sync-indicator" :class="syncClass" :title="syncLabel" aria-live="polite">
        <span class="sync-dot" aria-hidden="true" />
        {{ syncLabel }}
      </span>
      <button type="button" class="account-link" @click="accountStore.logout">Log out</button>
    </template>

    <template v-else>
      <RouterLink class="account-link" to="/login">Log in</RouterLink>
      <RouterLink class="account-primary" to="/register">Register</RouterLink>
    </template>
  </nav>
</template>
