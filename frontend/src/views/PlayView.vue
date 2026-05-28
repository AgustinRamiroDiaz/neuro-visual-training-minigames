<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PhaserGame from '../components/PhaserGame.vue';
import type { GameFinishedPayload } from '../history/playHistory';
import { findMinigameById } from '../minigames/findMinigame';
import { useAccountStore } from '../stores/accountStore';
import { useGameSettingsStore } from '../stores/gameSettingsStore';
import { useHistoryStore } from '../stores/historyStore';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();
const historyStore = useHistoryStore();
const settingsStore = useGameSettingsStore();

const gameId = computed(() => String(route.params.gameId ?? ''));
const minigame = computed(() => findMinigameById(gameId.value));
const gameSettings = computed(() =>
  minigame.value ? settingsStore.getSettingsForGame(minigame.value) : null,
);

const returnToCatalog = () => {
  router.push({ name: 'catalog' });
};

const handleGameFinished = (payload: GameFinishedPayload) => {
  if (!minigame.value) {
    return;
  }

  historyStore.addPlaythrough(minigame.value, payload);
  accountStore.saveToCloud(settingsStore.getCloudPreferences(), historyStore.records);
};
</script>

<template>
  <section v-if="minigame && gameSettings" class="play-view">
    <header class="play-header">
      <button type="button" class="back-button" @click="returnToCatalog">Back</button>
      <div>
        <p class="eyebrow">{{ minigame.skillArea }}</p>
        <h1>{{ minigame.title }}</h1>
      </div>
    </header>

    <PhaserGame
      :key="minigame.id"
      :minigame="minigame"
      :game-settings="gameSettings"
      @game-finished="handleGameFinished"
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
