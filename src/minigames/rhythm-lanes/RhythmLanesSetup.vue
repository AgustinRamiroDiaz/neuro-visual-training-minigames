<script setup lang="ts">
import { computed, ref } from 'vue';
import { keyOptions } from '../keyOptions';
import type { GameSettings } from '../../game/settings';
import type { Minigame } from '../types';

defineProps<{
  minigame: Minigame;
}>();

const emit = defineEmits<{
  start: [settings: GameSettings];
}>();

const defaultPool = ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'H'];
const keyCount = ref(4);
const keys = ref(['A', 'S', 'K', 'L']);

const hasDuplicateKeys = computed(() => {
  const uniqueKeys = new Set(keys.value);

  return uniqueKeys.size !== keys.value.length;
});

const updateKeyCount = () => {
  const nextCount = Math.max(1, Math.min(8, keyCount.value));
  keyCount.value = nextCount;

  if (keys.value.length > nextCount) {
    keys.value = keys.value.slice(0, nextCount);
    return;
  }

  keys.value = [...keys.value, ...defaultPool.slice(keys.value.length, nextCount)];
};

const start = () => {
  if (hasDuplicateKeys.value || keys.value.length === 0) {
    return;
  }

  emit('start', {
    sceneKey: 'RhythmLanesScene',
    settings: {
      keys: [...keys.value],
    },
  });
};
</script>

<template>
  <section class="setup-panel" aria-label="Rhythm Lanes setup">
    <div class="setup-row">
      <div>
        <h2>Instrument lanes</h2>
        <p>Set how many keys you want, then assign their left-to-right order.</p>
      </div>

      <label class="count-field">
        <span>Keys</span>
        <input v-model.number="keyCount" type="number" min="1" max="8" @input="updateKeyCount" />
      </label>
    </div>

    <div class="lane-order">
      <label v-for="(_, index) in keys" :key="index">
        <span>Lane {{ index + 1 }}</span>
        <select v-model="keys[index]">
          <option v-for="key in keyOptions" :key="key" :value="key">{{ key }}</option>
        </select>
      </label>
    </div>

    <p v-if="hasDuplicateKeys" class="setup-error">
      Each rhythm lane needs a unique key.
    </p>

    <footer class="setup-actions">
      <button type="button" class="start-button" :disabled="hasDuplicateKeys" @click="start">
        Start
      </button>
    </footer>
  </section>
</template>
