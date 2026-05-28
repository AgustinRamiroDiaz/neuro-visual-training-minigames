<script setup lang="ts">
import { computed, ref } from 'vue';
import GameCard from './components/GameCard.vue';
import PhaserGame from './components/PhaserGame.vue';
import { minigames, skillAreas, type Minigame } from './data/minigames';

const search = ref('');
const activeSkill = ref<(typeof skillAreas)[number]>('All');
const selectedGame = ref<Minigame | null>(null);

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

const playGame = (game: Minigame) => {
  selectedGame.value = game;
};
</script>

<template>
  <main class="app-shell">
    <section v-if="!selectedGame" class="catalog-view">
      <header class="catalog-header">
        <div>
          <p class="eyebrow">Neuro Visual Training</p>
          <h1>Choose a focused visual skill drill.</h1>
        </div>
        <p>
          Search the catalog, filter by skill area, then launch a Phaser-powered
          minigame session.
        </p>
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

    <section v-else class="play-view">
      <header class="play-header">
        <button type="button" class="back-button" @click="selectedGame = null">Back</button>
        <div>
          <p class="eyebrow">{{ selectedGame.skillArea }}</p>
          <h1>{{ selectedGame.title }}</h1>
        </div>
      </header>

      <PhaserGame :key="selectedGame.id" :minigame="selectedGame" />
    </section>
  </main>
</template>
