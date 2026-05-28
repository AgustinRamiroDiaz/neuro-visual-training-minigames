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

const leftKey = ref('A');
const rightKey = ref('D');

const presets = [
  { label: 'A + D', leftKey: 'A', rightKey: 'D' },
  { label: 'Left + Right', leftKey: 'LEFT', rightKey: 'RIGHT' },
  { label: 'F + J', leftKey: 'F', rightKey: 'J' },
];

const hasDuplicateKeys = computed(() => leftKey.value === rightKey.value);

const applyPreset = (preset: { leftKey: string; rightKey: string }) => {
  leftKey.value = preset.leftKey;
  rightKey.value = preset.rightKey;
};

const start = () => {
  if (hasDuplicateKeys.value) {
    return;
  }

  emit('start', {
    sceneKey: 'DualLaneDriveScene',
    settings: {
      leftKey: leftKey.value,
      rightKey: rightKey.value,
    },
  });
};
</script>

<template>
  <section class="setup-panel" aria-label="Dual Lane Drive setup">
    <div class="setup-row">
      <div>
        <h2>Car controls</h2>
        <p>Choose the keys that switch each car between its two lanes.</p>
      </div>

      <div class="preset-group" aria-label="Dual lane presets">
        <button
          v-for="preset in presets"
          :key="preset.label"
          type="button"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <div class="field-grid">
      <label>
        <span>Left car</span>
        <select v-model="leftKey">
          <option v-for="key in keyOptions" :key="key" :value="key">{{ key }}</option>
        </select>
      </label>

      <label>
        <span>Right car</span>
        <select v-model="rightKey">
          <option v-for="key in keyOptions" :key="key" :value="key">{{ key }}</option>
        </select>
      </label>
    </div>

    <p v-if="hasDuplicateKeys" class="setup-error">
      Choose two different keys.
    </p>

    <footer class="setup-actions">
      <button type="button" class="start-button" :disabled="hasDuplicateKeys" @click="start">
        Start
      </button>
    </footer>
  </section>
</template>
