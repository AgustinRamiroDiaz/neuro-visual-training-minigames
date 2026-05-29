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
        <InputText
          v-model="username"
          type="text"
          autocomplete="username"
          required
        />
      </label>

      <label v-if="isRegister">
        <span>Display name</span>
        <InputText
          v-model="displayName"
          type="text"
          autocomplete="name"
        />
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
          <RadioButton
            v-model="uploadLocalState"
            input-id="upload-local-state"
            :value="true"
          />
          <span>
            Upload and merge with the account
          </span>
        </label>
        <label>
          <RadioButton
            v-model="uploadLocalState"
            input-id="skip-local-state"
            :value="false"
          />
          <span>{{ skipLocalStateLabel }}</span>
        </label>
      </fieldset>

      <Message
        v-if="accountStore.syncError"
        severity="error"
        size="small"
      >
        {{ accountStore.syncError }}
      </Message>

      <footer class="setup-actions">
        <Button
          v-if="isRegister"
          as="router-link"
          label="Log in instead"
          to="/login"
          outlined
        />
        <Button
          v-else
          as="router-link"
          label="Register instead"
          to="/register"
          outlined
        />
        <Button
          type="submit"
          :label="submitLabel"
          :disabled="!username.trim() || accountStore.syncStatus === 'syncing'"
        />
      </footer>
    </form>
  </section>
</template>
