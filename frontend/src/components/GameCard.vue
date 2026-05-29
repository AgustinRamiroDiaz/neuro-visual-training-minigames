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
    <PreviewMark :minigame="minigame" />
    <span class="card-meta">{{ minigame.skillArea }} / {{ minigame.duration }}</span>
    <strong>{{ minigame.title }}</strong>
    <span>{{ minigame.summary }}</span>
    <span class="game-card-footer">
      <small>{{ minigame.difficulty }}</small>
      <small>{{ lastPlayed ? `Last played ${formatLastPlayed(lastPlayed)}` : 'Not played yet' }}</small>
    </span>
  </button>
</template>
