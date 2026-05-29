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
        <Tag
          class="account-name"
          :value="accountStore.user.username"
          severity="contrast"
        />
        <Badge
          class="sync-indicator"
          :class="syncClass"
          :value="syncLabel"
          :title="syncLabel"
          severity="secondary"
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

      <Message
        v-else-if="cloudStatus === 'checking'"
        class="cloud-checking"
        severity="secondary"
        size="small"
        icon="none"
        aria-live="polite"
      >
        Checking cloud
      </Message>

      <Message
        v-else
        v-tooltip.top="'Cloud save requires the Rocket backend. This client-only app still works locally. To host the backend, see github.com/AgustinRamiroDiaz/neuro-visual-training-minigames.'"
        class="cloud-unavailable"
        severity="warn"
        size="small"
        icon="none"
        tabindex="0"
      >
        Cloud unavailable
      </Message>
    </nav>
  </aside>
</template>
