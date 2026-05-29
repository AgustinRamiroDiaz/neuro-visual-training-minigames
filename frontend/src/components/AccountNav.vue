<script setup lang="ts">
import { useAccountStore } from '../stores/accountStore';
import { useCloudSync } from '../sync/useCloudSync';

const accountStore = useAccountStore();
const { logoutAndRestoreAnonymousState, syncClass, syncLabel } = useCloudSync();
</script>

<template>
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

    <template v-else>
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
  </nav>
</template>
