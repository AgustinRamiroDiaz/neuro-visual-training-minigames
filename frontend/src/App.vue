<script setup lang="ts">
import AccountNav from './components/AccountNav.vue';
</script>

<template>
  <main class="app-shell">
    <AccountNav />
    <RouterView />
  </main>
</template>
