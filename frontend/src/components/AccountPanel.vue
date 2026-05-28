<script setup lang="ts">
import { ref } from 'vue';
import { useAccountStore } from '../stores/accountStore';
import { useGameSettingsStore } from '../stores/gameSettingsStore';
import { useHistoryStore } from '../stores/historyStore';

const accountStore = useAccountStore();
const settingsStore = useGameSettingsStore();
const historyStore = useHistoryStore();
const username = ref('');

const createAccount = async () => {
  const nextUsername = username.value.trim();

  if (!nextUsername) {
    return;
  }

  await accountStore.createAccount(nextUsername);
  username.value = '';
  await saveToCloud();
};

const saveToCloud = () =>
  accountStore.saveToCloud(settingsStore.getCloudPreferences(), historyStore.records);

const loadFromCloud = async () => {
  const sync = await accountStore.loadFromCloud();

  if (!sync) {
    return;
  }

  settingsStore.replaceFromCloud(sync.preferences.gameSettings);
  historyStore.replaceRecords(sync.history);
};
</script>

<template>
  <section class="account-panel" aria-label="Cloud save">
    <template v-if="accountStore.user">
      <div>
        <span>Cloud account</span>
        <strong>{{ accountStore.user.username }}</strong>
      </div>
      <div class="account-actions">
        <button type="button" class="secondary-button" @click="saveToCloud">Save</button>
        <button type="button" class="secondary-button" @click="loadFromCloud">Load</button>
      </div>
    </template>

    <template v-else>
      <label>
        <span>Cloud save</span>
        <input v-model="username" type="text" placeholder="Username" @keyup.enter="createAccount" />
      </label>
      <button
        type="button"
        class="secondary-button"
        :disabled="!username.trim() || accountStore.syncStatus === 'syncing'"
        @click="createAccount"
      >
        Create
      </button>
    </template>

    <p v-if="accountStore.syncError" class="setup-error">{{ accountStore.syncError }}</p>
    <p v-else-if="accountStore.syncStatus === 'synced'" class="sync-status">Cloud save ready.</p>
  </section>
</template>
