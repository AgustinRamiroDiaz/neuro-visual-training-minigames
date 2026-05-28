<script setup lang="ts">
import { computed, ref } from 'vue';
import GameCard from './components/GameCard.vue';
import PhaserGame from './components/PhaserGame.vue';
import { minigames, skillAreas, type MinigameDefinition } from './data/minigames';
import type { GameSettings } from './game/settings';
import HistoryView from './views/HistoryView.vue';
import {
  createPlayHistoryRecord,
  loadPlayHistory,
  savePlayHistory,
  type GameFinishedPayload,
  type PlayHistoryRecord,
} from './history/playHistory';

const search = ref('');
const activeSkill = ref<(typeof skillAreas)[number]>('All');
const configuringGame = ref<MinigameDefinition | null>(null);
const activeGame = ref<MinigameDefinition | null>(null);
const activeGameSettings = ref<GameSettings | null>(null);
const historyVisible = ref(false);
const playHistory = ref<PlayHistoryRecord[]>(loadPlayHistory());

const filteredGames = computed(() => {
  const query = search.value.trim().toLowerCase();

  return minigames.filter((game) => {
    const matchesSkill = activeSkill.value === 'All' || game.skillArea === activeSkill.value;
    const matchesSearch =
      query.length === 0 ||
      [game.title, game.summary, game.skillArea, game.difficulty].some((value) =>
        value.toLowerCase().includes(query),
      );

    return matchesSkill && matchesSearch;
  });
});

const playGame = (game: MinigameDefinition) => {
  historyVisible.value = false;
  configuringGame.value = game;
};

const startConfiguredGame = (settings: GameSettings) => {
  if (!configuringGame.value) {
    return;
  }

  activeGameSettings.value = settings;
  activeGame.value = configuringGame.value;
  configuringGame.value = null;
};

const returnToCatalog = () => {
  configuringGame.value = null;
  activeGame.value = null;
  activeGameSettings.value = null;
  historyVisible.value = false;
};

const showHistory = () => {
  configuringGame.value = null;
  activeGame.value = null;
  activeGameSettings.value = null;
  historyVisible.value = true;
};

const handleGameFinished = (payload: GameFinishedPayload) => {
  if (!activeGame.value) {
    return;
  }

  const nextHistory = [createPlayHistoryRecord(activeGame.value, payload), ...playHistory.value];
  playHistory.value = nextHistory;
  savePlayHistory(nextHistory);
};
</script>

<template>
  <main class="app-shell">
    <HistoryView v-if="historyVisible" :records="playHistory" @catalog="returnToCatalog" />

    <section v-else-if="!configuringGame && !activeGame" class="catalog-view">
      <header class="catalog-header">
        <div>
          <p class="eyebrow">Neuro Visual Training</p>
          <h1>Choose a focused visual skill drill.</h1>
        </div>
        <div class="catalog-summary">
          <p>
            Search the catalog, filter by skill area, then launch a Phaser-powered
            minigame session.
          </p>
          <button type="button" class="back-button" @click="showHistory">
            History {{ playHistory.length }}
          </button>
        </div>
      </header>

      <section class="toolbar" aria-label="Minigame filters">
        <label class="search-field">
          <span>Search</span>
          <input v-model="search" type="search" placeholder="Try reaction, tracking, memory..." />
        </label>

        <div class="skill-filter" role="list" aria-label="Skill area">
          <button
            v-for="skill in skillAreas"
            :key="skill"
            type="button"
            :class="{ active: activeSkill === skill }"
            @click="activeSkill = skill"
          >
            {{ skill }}
          </button>
        </div>
      </section>

      <section class="game-grid" aria-label="Available minigames">
        <GameCard
          v-for="game in filteredGames"
          :key="game.id"
          :minigame="game"
          @select="playGame"
        />

        <p v-if="filteredGames.length === 0" class="empty-state">
          No minigames match that search.
        </p>
      </section>
    </section>

    <section v-else-if="configuringGame" class="setup-view">
      <header class="play-header">
        <button type="button" class="back-button" @click="returnToCatalog">Back</button>
        <div>
          <p class="eyebrow">{{ configuringGame.skillArea }}</p>
          <h1>{{ configuringGame.title }}</h1>
        </div>
      </header>

      <component
        :is="configuringGame.setupComponent"
        :minigame="configuringGame"
        @start="startConfiguredGame"
      />
    </section>

    <section v-else-if="activeGame && activeGameSettings" class="play-view">
      <header class="play-header">
        <button type="button" class="back-button" @click="returnToCatalog">Back</button>
        <div>
          <p class="eyebrow">{{ activeGame.skillArea }}</p>
          <h1>{{ activeGame.title }}</h1>
        </div>
      </header>

      <PhaserGame
        :key="activeGame.id"
        :minigame="activeGame"
        :game-settings="activeGameSettings"
        @game-finished="handleGameFinished"
      />
    </section>
  </main>
</template>
