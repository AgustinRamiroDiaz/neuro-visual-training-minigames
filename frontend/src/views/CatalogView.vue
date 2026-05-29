<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import GameCard from '../components/GameCard.vue';
import { minigames, skillAreas, type MinigameDefinition } from '../data/minigames';
import { useHistoryStore } from '../stores/historyStore';

const router = useRouter();
const historyStore = useHistoryStore();
const search = ref('');
const activeSkill = ref<(typeof skillAreas)[number]>('All');

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

const configureGame = (game: MinigameDefinition) => {
  void router.push({ name: 'game-setup', params: { gameId: game.id } });
};
</script>

<template>
  <section class="catalog-view">
    <header class="catalog-header">
      <div>
        <p class="eyebrow">
          Neuro Visual Training
        </p>
        <h1>Choose a focused visual skill drill.</h1>
      </div>
      <div class="catalog-summary">
        <p>
          Search the catalog, filter by skill area, then launch a Phaser-powered
          minigame session.
        </p>
        <RouterLink
          class="back-button"
          to="/history"
        >
          History {{ historyStore.count }}
        </RouterLink>
      </div>
    </header>

    <section
      class="toolbar"
      aria-label="Minigame filters"
    >
      <label class="search-field">
        <span>Search</span>
        <input
          v-model="search"
          type="search"
          placeholder="Try reaction, tracking, memory..."
        >
      </label>

      <div
        class="skill-filter"
        role="list"
        aria-label="Skill area"
      >
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

    <section
      class="game-grid"
      aria-label="Available minigames"
    >
      <GameCard
        v-for="game in filteredGames"
        :key="game.id"
        :minigame="game"
        :last-played="historyStore.lastPlayedByGameId[game.id]"
        @select="configureGame"
      />

      <p
        v-if="filteredGames.length === 0"
        class="empty-state"
      >
        No minigames match that search.
      </p>
    </section>
  </section>
</template>
