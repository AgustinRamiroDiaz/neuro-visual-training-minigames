<script setup lang="ts">
import type { Minigame } from '../data/minigames';
import PreviewMark from './PreviewMark.vue';

defineProps<{
  minigame: Minigame;
}>();

defineEmits<{
  select: [minigame: Minigame];
}>();
</script>

<template>
  <button class="game-card" type="button" @click="$emit('select', minigame)">
    <PreviewMark :minigame="minigame" />
    <span class="card-meta">{{ minigame.skillArea }} / {{ minigame.duration }}</span>
    <strong>{{ minigame.title }}</strong>
    <span>{{ minigame.summary }}</span>
    <small>{{ minigame.difficulty }}</small>
  </button>
</template>
