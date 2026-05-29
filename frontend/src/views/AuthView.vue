<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountStore } from '../stores/accountStore';
import { useGameSettingsStore } from '../stores/gameSettingsStore';
import { useHistoryStore } from '../stores/historyStore';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();
const settingsStore = useGameSettingsStore();
const historyStore = useHistoryStore();
const username = ref('');
const displayName = ref('');

const isRegister = computed(() => route.name === 'register');
const title = computed(() => (isRegister.value ? 'Register' : 'Log in'));
const submitLabel = computed(() => (isRegister.value ? 'Create account' : 'Log in'));

const submit = async () => {
  const nextUsername = username.value.trim();

  if (!nextUsername) {
    return;
  }

  if (isRegister.value) {
    await accountStore.createAccount(nextUsername, displayName.value.trim() || undefined);
    await accountStore.saveToCloud(settingsStore.getCloudPreferences(), historyStore.records);
  } else {
    await accountStore.login(nextUsername);
    const sync = await accountStore.loadFromCloud();

    if (sync) {
      settingsStore.replaceFromCloud(sync.preferences.gameSettings);
      historyStore.replaceRecords(sync.history);
    }
  }

  void router.push({ name: 'catalog' });
};
</script>

<template>
  <section class="auth-view">
    <header class="play-header">
      <RouterLink
        class="back-button"
        to="/"
      >
        Catalog
      </RouterLink>
      <div>
        <p class="eyebrow">
          Cloud Save
        </p>
        <h1>{{ title }}</h1>
      </div>
    </header>

    <form
      class="auth-panel"
      @submit.prevent="submit"
    >
      <label>
        <span>Username</span>
        <input
          v-model="username"
          type="text"
          autocomplete="username"
          required
        >
      </label>

      <label v-if="isRegister">
        <span>Display name</span>
        <input
          v-model="displayName"
          type="text"
          autocomplete="name"
        >
      </label>

      <p class="auth-note">
        Accounts are currently username-based for cloud save development.
      </p>

      <p
        v-if="accountStore.syncError"
        class="setup-error"
      >
        {{ accountStore.syncError }}
      </p>

      <footer class="setup-actions">
        <RouterLink
          v-if="isRegister"
          class="secondary-button"
          to="/login"
        >
          Log in instead
        </RouterLink>
        <RouterLink
          v-else
          class="secondary-button"
          to="/register"
        >
          Register instead
        </RouterLink>
        <button
          type="submit"
          class="start-button"
          :disabled="!username.trim() || accountStore.syncStatus === 'syncing'"
        >
          {{ submitLabel }}
        </button>
      </footer>
    </form>
  </section>
</template>
