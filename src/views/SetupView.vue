<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { GameSettings } from '../game/settings';
import { findMinigameById } from '../minigames/findMinigame';
import { useGameSettingsStore } from '../stores/gameSettingsStore';

const route = useRoute();
const router = useRouter();
const settingsStore = useGameSettingsStore();

const gameId = computed(() => String(route.params.gameId ?? ''));
const minigame = computed(() => findMinigameById(gameId.value));
const initialSettings = computed(() =>
  minigame.value ? settingsStore.getSettingsForGame(minigame.value) : null,
);

const returnToCatalog = () => {
  router.push({ name: 'catalog' });
};

const startGame = (settings: GameSettings) => {
  if (!minigame.value) {
    return;
  }

  settingsStore.saveSettings(minigame.value.id, settings);
  router.push({ name: 'game-play', params: { gameId: minigame.value.id } });
};
</script>

<template>
  <section v-if="minigame && initialSettings" class="setup-view">
    <header class="play-header">
      <button type="button" class="back-button" @click="returnToCatalog">Back</button>
      <div>
        <p class="eyebrow">{{ minigame.skillArea }}</p>
        <h1>{{ minigame.title }}</h1>
      </div>
    </header>

    <component
      :is="minigame.setupComponent"
      :minigame="minigame"
      :initial-settings="initialSettings"
      @start="startGame"
    />
  </section>

  <section v-else class="setup-view">
    <header class="play-header">
      <button type="button" class="back-button" @click="returnToCatalog">Catalog</button>
      <div>
        <p class="eyebrow">Missing Minigame</p>
        <h1>That drill is not available.</h1>
      </div>
    </header>
  </section>
</template>
