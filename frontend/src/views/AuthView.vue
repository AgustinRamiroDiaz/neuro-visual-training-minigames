<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { CloudPreferences } from '../api/cloudSync';
import { useAccountStore } from '../stores/accountStore';
import { useGameSettingsStore } from '../stores/gameSettingsStore';
import { useHistoryStore } from '../stores/historyStore';
import {
  getCurrentTrainingState,
  hasTrainingState,
  mergeHistory,
  mergePreferences,
  saveAnonymousTrainingState,
} from '../sync/localProfiles';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();
const settingsStore = useGameSettingsStore();
const historyStore = useHistoryStore();
const username = ref('');
const displayName = ref('');
const uploadLocalState = ref(true);

const isRegister = computed(() => route.name === 'register');
const title = computed(() => (isRegister.value ? 'Register' : 'Log in'));
const submitLabel = computed(() => (isRegister.value ? 'Create account' : 'Log in'));
const skipLocalStateLabel = computed(() =>
  isRegister.value ? 'Start this account empty' : "Use only the account's cloud state",
);
const currentLocalState = computed(() =>
  getCurrentTrainingState(historyStore.records, settingsStore.getCloudPreferences()),
);
const hasLocalState = computed(() => hasTrainingState(currentLocalState.value));
const localStateSummary = computed(() => {
  const settingsCount = Object.keys(currentLocalState.value.gameSettings).length;
  const historyCount = currentLocalState.value.history.length;
  const parts = [];

  if (historyCount > 0) {
    parts.push(`${historyCount} play ${historyCount === 1 ? 'record' : 'records'}`);
  }

  if (settingsCount > 0) {
    parts.push(`${settingsCount} game ${settingsCount === 1 ? 'setting' : 'settings'}`);
  }

  return parts.join(' and ');
});

const submit = async () => {
  const nextUsername = username.value.trim();

  if (!nextUsername) {
    return;
  }

  const anonymousState = currentLocalState.value;
  const shouldUploadLocalState = hasLocalState.value && uploadLocalState.value;

  saveAnonymousTrainingState(anonymousState);

  if (isRegister.value) {
    await accountStore.createAccount(nextUsername, displayName.value.trim() || undefined);

    if (shouldUploadLocalState) {
      await accountStore.saveToCloud(
        { gameSettings: anonymousState.gameSettings },
        anonymousState.history,
      );
    } else {
      settingsStore.replaceFromCloud({});
      historyStore.replaceRecords([]);
      await accountStore.saveToCloud({ gameSettings: {} }, []);
    }
  } else {
    await accountStore.login(nextUsername);
    const sync = await accountStore.loadFromCloud();

    if (sync) {
      const nextPreferences = shouldUploadLocalState
        ? mergePreferences(sync.preferences, { gameSettings: anonymousState.gameSettings })
        : sync.preferences;
      const nextHistory = shouldUploadLocalState
        ? mergeHistory(sync.history, anonymousState.history)
        : sync.history;

      applySyncedState(nextPreferences, nextHistory);

      if (shouldUploadLocalState) {
        await accountStore.saveToCloud(nextPreferences, nextHistory);
      }
    }
  }

  void router.push({ name: 'catalog' });
};

function applySyncedState(preferences: CloudPreferences, history: typeof historyStore.records) {
  settingsStore.replaceFromCloud(preferences.gameSettings);
  historyStore.replaceRecords(history);
}
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

      <fieldset
        v-if="hasLocalState"
        class="auth-choice"
      >
        <legend>Local progress found</legend>
        <p>
          This browser has {{ localStateSummary }}. Keep a private anonymous copy on this device and
          choose what happens for this account.
        </p>
        <label>
          <input
            v-model="uploadLocalState"
            type="radio"
            :value="true"
          >
          <span>Upload and merge with the account</span>
        </label>
        <label>
          <input
            v-model="uploadLocalState"
            type="radio"
            :value="false"
          >
          <span>{{ skipLocalStateLabel }}</span>
        </label>
      </fieldset>

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
