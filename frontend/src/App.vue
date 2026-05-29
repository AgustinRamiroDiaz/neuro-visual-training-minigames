<script setup lang="ts">
import AccountNav from './components/AccountNav.vue';
import { useCloudSync } from './sync/useCloudSync';

useCloudSync({ start: true });
</script>

<template>
  <main class="app-shell">
    <AccountNav />
    <RouterView />
  </main>
</template>
