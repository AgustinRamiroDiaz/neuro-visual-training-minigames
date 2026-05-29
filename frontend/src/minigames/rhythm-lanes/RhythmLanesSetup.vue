<script setup lang="ts">
import { computed, ref } from 'vue';
import { keyOptions } from '../keyOptions';
import type { GameSettings, RhythmLanesSettings } from '../../game/settings';
import type { Minigame } from '../types';
import { useStoredPresets } from '../../presets/useStoredPresets';

const props = defineProps<{
  minigame: Minigame;
  initialSettings?: GameSettings;
}>();

const emit = defineEmits<{
  start: [settings: GameSettings];
}>();

const defaultPool = ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'H'];
const initialRhythmLanesSettings =
  props.initialSettings?.sceneKey === 'RhythmLanesScene'
    ? props.initialSettings.settings
    : { keys: ['A', 'S', 'K', 'L'] };

const keys = ref([...initialRhythmLanesSettings.keys]);
const draggedIndex = ref<number | null>(null);
const presetName = ref('');

const presets = [
  { label: 'QWER', keys: ['Q', 'W', 'E', 'R'] },
  { label: 'AWD', keys: ['A', 'W', 'D'] },
  { label: 'Left Up Right', keys: ['LEFT', 'UP', 'RIGHT'] },
];

const { presets: userPresets, savePreset, deletePreset } =
  useStoredPresets<RhythmLanesSettings>('rhythm-lanes');

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

const getCurrentSettings = (): RhythmLanesSettings => ({
  keys: [...keys.value],
});

const saveCurrentPreset = async () => {
  if (hasDuplicateKeys.value || keys.value.length === 0 || !presetName.value.trim()) {
    return;
  }

  await savePreset(presetName.value, getCurrentSettings());
  presetName.value = '';
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
    settings: getCurrentSettings(),
  });
};
</script>

<template>
  <section
    class="setup-panel"
    aria-label="Rhythm Lanes setup"
  >
    <div class="setup-row">
      <div>
        <h2>Instrument lanes</h2>
        <p>Drag keys to set lane order. Add lanes beside any key, or remove a lane from its corner.</p>
      </div>
    </div>

    <section
      class="preset-panel"
      aria-label="Rhythm lane presets"
    >
      <div class="preset-column">
        <span>Presets</span>
        <ButtonGroup
          class="preset-group"
          aria-label="Built-in rhythm lane presets"
        >
          <Button
            v-for="preset in presets"
            :key="preset.label"
            :label="preset.label"
            severity="secondary"
            outlined
            @click="applyPreset(preset)"
          />
        </ButtonGroup>
      </div>

      <div
        v-if="userPresets.length > 0"
        class="preset-column"
        aria-label="Saved presets"
      >
        <span>Saved</span>
        <div class="saved-preset-list">
          <ButtonGroup
            v-for="preset in userPresets"
            :key="preset.id"
            class="saved-preset"
          >
            <Button
              :label="preset.name"
              text
              severity="secondary"
              @click="applyPreset(preset.value)"
            />
            <Button
              label="-"
              class="saved-preset-delete"
              text
              severity="danger"
              :aria-label="`Delete ${preset.name}`"
              @click="deletePreset(preset.id)"
            />
          </ButtonGroup>
        </div>
      </div>

      <label class="preset-save-field">
        <span>Save current</span>
        <InputGroup class="preset-save-control">
          <InputText
            v-model="presetName"
            type="text"
            placeholder="Preset name"
          />
          <Button
            label="Save preset"
            outlined
            severity="secondary"
            :disabled="hasDuplicateKeys || !presetName.trim()"
            @click="saveCurrentPreset"
          />
        </InputGroup>
      </label>
    </section>

    <div
      class="lane-builder"
      aria-label="Rhythm lane order"
    >
      <Button
        label="+"
        class="lane-add-button"
        severity="secondary"
        rounded
        outlined
        :disabled="!canAddLane"
        aria-label="Add lane at start"
        @click="addLane(0)"
      />

      <template
        v-for="(key, index) in keys"
        :key="`${key}-${index}`"
      >
        <article
          class="lane-tile"
          :class="{ dragging: draggedIndex === index }"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragend="draggedIndex = null"
          @dragover.prevent
          @drop="onDrop(index)"
        >
          <Button
            label="-"
            class="lane-remove-button"
            severity="danger"
            rounded
            outlined
            :disabled="!canRemoveLane"
            :aria-label="`Remove ${key} lane`"
            @click="removeLane(index)"
          />

          <label class="lane-key-picker">
            <span class="sr-only">Key for lane {{ index + 1 }}</span>
            <Select
              v-model="keys[index]"
              :options="[...keyOptions]"
              @mousedown.stop
              @dragstart.stop
            />
          </label>
          <span>Lane {{ index + 1 }}</span>
        </article>

        <Button
          label="+"
          class="lane-add-button"
          severity="secondary"
          rounded
          outlined
          :disabled="!canAddLane"
          :aria-label="`Add lane after ${key}`"
          @click="addLane(index + 1)"
        />
      </template>
    </div>

    <Message
      v-if="hasDuplicateKeys"
      class="setup-error"
      severity="error"
      size="small"
      icon="none"
    >
      Each rhythm lane needs a unique key.
    </Message>

    <footer class="setup-actions">
      <Button
        label="Start"
        :disabled="hasDuplicateKeys"
        @click="start"
      />
    </footer>
  </section>
</template>
