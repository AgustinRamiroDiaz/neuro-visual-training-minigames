<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { checkCloudHealth } from '../api/cloudSync';
import { useAccountStore } from '../stores/accountStore';
import { useCloudSync } from '../sync/useCloudSync';

const accountStore = useAccountStore();
const { logoutAndRestoreAnonymousState, syncClass, syncLabel } = useCloudSync();
const cloudStatus = ref<'checking' | 'online' | 'offline'>('checking');
const canShowAccountActions = computed(
  () => accountStore.user !== null || cloudStatus.value === 'online',
);

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
      <RouterLink
        class="sidebar-link"
        to="/"
      >
        Minigames
      </RouterLink>
      <RouterLink
        class="sidebar-link"
        to="/history"
      >
        History
      </RouterLink>
    </nav>

    <nav
      class="account-nav"
      aria-label="Account"
    >
      <template v-if="accountStore.user">
        <span class="account-name">{{ accountStore.user.username }}</span>
        <span
          class="sync-indicator"
          :class="syncClass"
          :title="syncLabel"
          aria-live="polite"
        >
          <span
            class="sync-dot"
            aria-hidden="true"
          />
          {{ syncLabel }}
        </span>
        <button
          type="button"
          class="account-link"
          @click="logoutAndRestoreAnonymousState"
        >
          Log out
        </button>
      </template>

      <template v-else-if="canShowAccountActions">
        <RouterLink
          class="account-link"
          to="/login"
        >
          Log in
        </RouterLink>
        <RouterLink
          class="account-primary"
          to="/register"
        >
          Register
        </RouterLink>
      </template>

      <p
        v-else-if="cloudStatus === 'checking'"
        class="cloud-checking"
        aria-live="polite"
      >
        <span
          class="sync-dot"
          aria-hidden="true"
        />
        Checking cloud
      </p>

      <p
        v-else
        class="cloud-unavailable"
        tabindex="0"
        title="Cloud save requires the Rocket backend. This client-only app still works locally. To host the backend, see github.com/AgustinRamiroDiaz/neuro-visual-training-minigames."
      >
        <span
          class="sync-dot"
          aria-hidden="true"
        />
        Cloud unavailable
      </p>
    </nav>
  </aside>
</template>
