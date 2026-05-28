<script setup lang="ts">
import { useAccountStore } from '../stores/accountStore';
import { useGameSettingsStore } from '../stores/gameSettingsStore';
import { useHistoryStore } from '../stores/historyStore';

const accountStore = useAccountStore();
const settingsStore = useGameSettingsStore();
const historyStore = useHistoryStore();

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
  <nav class="account-nav" aria-label="Account">
    <template v-if="accountStore.user">
      <span class="account-name">{{ accountStore.user.username }}</span>
      <button type="button" class="account-link" @click="saveToCloud">Save</button>
      <button type="button" class="account-link" @click="loadFromCloud">Load</button>
      <button type="button" class="account-link" @click="accountStore.logout">Log out</button>
    </template>

    <template v-else>
      <RouterLink class="account-link" to="/login">Log in</RouterLink>
      <RouterLink class="account-primary" to="/register">Register</RouterLink>
    </template>
  </nav>
</template>
