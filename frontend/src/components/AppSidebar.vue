<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { checkCloudHealth } from '../api/cloudSync';
import { useAccountStore } from '../stores/accountStore';
import { useCloudSync } from '../sync/useCloudSync';

const route = useRoute();
const accountStore = useAccountStore();
const { logoutAndRestoreAnonymousState, syncLabel } = useCloudSync();
const cloudStatus = ref<'checking' | 'online' | 'offline'>('checking');
const canShowAccountActions = computed(
  () => accountStore.user !== null || cloudStatus.value === 'online',
);
const syncSeverity = computed(() => {
  if (accountStore.syncStatus === 'error' || accountStore.syncStatus === 'offline') {
    return 'warn';
  }

  if (accountStore.syncStatus === 'syncing' || accountStore.pendingSync) {
    return 'info';
  }

  return 'success';
});

const checkBackendConnection = async () => {
  if (accountStore.user) {
    return;
  }

  if (!navigator.onLine) {
    cloudStatus.value = 'offline';
    return;
  }

  cloudStatus.value = 'checking';
  cloudStatus.value = (await checkCloudHealth()) ? 'online' : 'offline';
};

const handleOnline = () => {
  void checkBackendConnection();
};

const handleOffline = () => {
  if (!accountStore.user) {
    cloudStatus.value = 'offline';
  }
};

onMounted(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  void checkBackendConnection();
});

onBeforeUnmount(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});
</script>

<template>
  <aside
    class="app-sidebar"
    aria-label="Primary"
  >
    <RouterLink
      class="sidebar-brand"
      to="/"
    >
      Neuro Trainer
    </RouterLink>

    <nav
      class="sidebar-nav"
      aria-label="Views"
    >
      <Button
        as="router-link"
        label="Minigames"
        to="/"
        :outlined="route.name !== 'catalog'"
        severity="secondary"
      />
      <Button
        as="router-link"
        label="History"
        to="/history"
        :outlined="route.name !== 'history'"
        severity="secondary"
      />
    </nav>

    <nav
      class="account-nav"
      aria-label="Account"
    >
      <template v-if="accountStore.user">
        <Tag
          class="account-name"
          :value="accountStore.user.username"
          severity="contrast"
        />
        <Badge
          class="sync-indicator"
          :value="syncLabel"
          :title="syncLabel"
          :severity="syncSeverity"
          aria-live="polite"
        />
        <Button
          label="Log out"
          class="account-action"
          outlined
          @click="logoutAndRestoreAnonymousState"
        />
      </template>

      <template v-else-if="canShowAccountActions">
        <Button
          as="router-link"
          label="Log in"
          to="/login"
          class="account-action"
          outlined
        />
        <Button
          as="router-link"
          label="Register"
          to="/register"
          class="account-action"
        />
      </template>

      <Tag
        v-else-if="cloudStatus === 'checking'"
        class="cloud-status"
        value="Checking cloud"
        severity="secondary"
        aria-live="polite"
      />

      <Tag
        v-else
        v-tooltip.top="'Cloud save requires the Rocket backend. This client-only app still works locally. To host the backend, see github.com/AgustinRamiroDiaz/neuro-visual-training-minigames.'"
        class="cloud-status"
        value="Cloud unavailable"
        severity="warn"
        tabindex="0"
      />
    </nav>
  </aside>
</template>
