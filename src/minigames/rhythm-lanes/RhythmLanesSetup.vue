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
const keys = ref(['A', 'S', 'K', 'L']);
const draggedIndex = ref<number | null>(null);

const presets = [
  { label: 'QWER', keys: ['Q', 'W', 'E', 'R'] },
  { label: 'AWD', keys: ['A', 'W', 'D'] },
  { label: 'Left Up Right', keys: ['LEFT', 'UP', 'RIGHT'] },
];

const hasDuplicateKeys = computed(() => {
  const uniqueKeys = new Set(keys.value);

  return uniqueKeys.size !== keys.value.length;
});

const canAddLane = computed(() => keys.value.length < Math.min(8, keyOptions.length));
const canRemoveLane = computed(() => keys.value.length > 1);

const getNextKey = () => {
  const usedKeys = new Set(keys.value);
  const nextDefault = defaultPool.find((key) => !usedKeys.has(key));

  if (nextDefault) {
    return nextDefault;
  }

  return keyOptions.find((key) => !usedKeys.has(key)) ?? keyOptions[0];
};

const addLane = (insertIndex: number) => {
  if (!canAddLane.value) {
    return;
  }

  keys.value.splice(insertIndex, 0, getNextKey());
};

const removeLane = (index: number) => {
  if (!canRemoveLane.value) {
    return;
  }

  keys.value.splice(index, 1);
};

const applyPreset = (preset: { keys: string[] }) => {
  keys.value = [...preset.keys];
};

const onDragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index;
  event.dataTransfer?.setData('text/plain', String(index));
  event.dataTransfer?.setDragImage(event.currentTarget as Element, 48, 48);
};

const onDrop = (targetIndex: number) => {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    draggedIndex.value = null;
    return;
  }

  const nextKeys = [...keys.value];
  const [movedKey] = nextKeys.splice(draggedIndex.value, 1);
  nextKeys.splice(targetIndex, 0, movedKey);
  keys.value = nextKeys;
  draggedIndex.value = null;
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
        <p>Drag keys to set lane order. Add lanes beside any key, or remove a lane from its corner.</p>
      </div>

      <div class="preset-group" aria-label="Rhythm lane presets">
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

    <div class="lane-builder" aria-label="Rhythm lane order">
      <button
        type="button"
        class="lane-add-button"
        :disabled="!canAddLane"
        aria-label="Add lane at start"
        @click="addLane(0)"
      >
        +
      </button>

      <template v-for="(key, index) in keys" :key="`${key}-${index}`">
        <article
          class="lane-tile"
          :class="{ dragging: draggedIndex === index }"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragend="draggedIndex = null"
          @dragover.prevent
          @drop="onDrop(index)"
        >
          <button
            type="button"
            class="lane-remove-button"
            :disabled="!canRemoveLane"
            :aria-label="`Remove ${key} lane`"
            @click="removeLane(index)"
          >
            -
          </button>

          <label class="lane-key-picker">
            <span class="sr-only">Key for lane {{ index + 1 }}</span>
            <select v-model="keys[index]" @mousedown.stop @dragstart.stop>
              <option v-for="option in keyOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
          <span>Lane {{ index + 1 }}</span>
        </article>

        <button
          type="button"
          class="lane-add-button"
          :disabled="!canAddLane"
          :aria-label="`Add lane after ${key}`"
          @click="addLane(index + 1)"
        >
          +
        </button>
      </template>
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
