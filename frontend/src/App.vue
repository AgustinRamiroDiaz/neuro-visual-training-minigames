<script setup lang="ts">
import AppSidebar from './components/AppSidebar.vue';
import { useCloudSync } from './sync/useCloudSync';

useCloudSync({ start: true });
</script>

<template>
  <main class="app-shell">
    <AppSidebar />
    <section class="app-content">
      <RouterView />
    </section>
  </main>
</template>
