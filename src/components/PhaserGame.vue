<script setup lang="ts">
import Phaser from 'phaser';
import { onBeforeUnmount, onMounted, ref, toRaw } from 'vue';
import type { Minigame } from '../data/minigames';
import { EventBus } from '../game/EventBus';
import { createGame } from '../game/main';
import type { GameSettings } from '../game/settings';

const props = defineProps<{
  minigame: Minigame;
  gameSettings: GameSettings;
}>();

const emit = defineEmits<{
  currentActiveScene: [scene: Phaser.Scene];
}>();

const gameContainer = ref<HTMLDivElement | null>(null);
const game = ref<Phaser.Game | null>(null);
const scene = ref<Phaser.Scene | null>(null);

const onSceneReady = (readyScene: Phaser.Scene) => {
  scene.value = readyScene;
  emit('currentActiveScene', readyScene);
};

onMounted(() => {
  if (!gameContainer.value) {
    return;
  }

  EventBus.on('current-scene-ready', onSceneReady);
  game.value = createGame(gameContainer.value, props.minigame, props.gameSettings);
});

onBeforeUnmount(() => {
  EventBus.off('current-scene-ready', onSceneReady);
  toRaw(game.value)?.destroy(true);
  game.value = null;
});

defineExpose({
  game,
  scene,
});
</script>

<template>
  <div ref="gameContainer" class="phaser-game" />
</template>
