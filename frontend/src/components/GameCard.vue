<script setup lang="ts">
import type { Minigame } from '../data/minigames';
import PreviewMark from './PreviewMark.vue';

defineProps<{
  minigame: Minigame;
  lastPlayed?: string;
}>();

defineEmits<{
  select: [minigame: Minigame];
}>();

const lastPlayedFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const formatLastPlayed = (timestamp: string) => {
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime()) ? timestamp : lastPlayedFormatter.format(date);
};
</script>

<template>
  <button
    class="game-card"
    type="button"
    @click="$emit('select', minigame)"
  >
    <Card>
      <template #header>
        <PreviewMark :minigame="minigame" />
      </template>

      <template #title>
        {{ minigame.title }}
      </template>

      <template #subtitle>
        {{ minigame.skillArea }} / {{ minigame.duration }}
      </template>

      <template #content>
        <p>{{ minigame.summary }}</p>
      </template>

      <template #footer>
        <span class="game-card-footer">
          <small>{{ minigame.difficulty }}</small>
          <small>{{ lastPlayed ? `Last played ${formatLastPlayed(lastPlayed)}` : 'Not played yet' }}</small>
        </span>
      </template>
    </Card>
  </button>
</template>
