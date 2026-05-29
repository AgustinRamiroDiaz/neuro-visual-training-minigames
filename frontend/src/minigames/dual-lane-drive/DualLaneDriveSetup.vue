<script setup lang="ts">
import { computed, ref } from 'vue';
import { keyOptions } from '../keyOptions';
import type { DualLaneDriveSettings, GameSettings } from '../../game/settings';
import type { Minigame } from '../types';
import { useStoredPresets } from '../../presets/useStoredPresets';

const props = defineProps<{
  minigame: Minigame;
  initialSettings?: GameSettings;
}>();

const emit = defineEmits<{
  start: [settings: GameSettings];
}>();

const initialDualLaneSettings =
  props.initialSettings?.sceneKey === 'DualLaneDriveScene'
    ? props.initialSettings.settings
    : { leftKey: 'A', rightKey: 'D' };

const leftKey = ref(initialDualLaneSettings.leftKey);
const rightKey = ref(initialDualLaneSettings.rightKey);
const presetName = ref('');

const presets = [
  { label: 'A + D', leftKey: 'A', rightKey: 'D' },
  { label: 'Left + Right', leftKey: 'LEFT', rightKey: 'RIGHT' },
  { label: 'F + J', leftKey: 'F', rightKey: 'J' },
];

const { presets: userPresets, savePreset, deletePreset } =
  useStoredPresets<DualLaneDriveSettings>('dual-lane-drive');

const hasDuplicateKeys = computed(() => leftKey.value === rightKey.value);

const applyPreset = (preset: { leftKey: string; rightKey: string }) => {
  leftKey.value = preset.leftKey;
  rightKey.value = preset.rightKey;
};

const getCurrentSettings = (): DualLaneDriveSettings => ({
  leftKey: leftKey.value,
  rightKey: rightKey.value,
});

const saveCurrentPreset = async () => {
  if (hasDuplicateKeys.value || !presetName.value.trim()) {
    return;
  }

  await savePreset(presetName.value, getCurrentSettings());
  presetName.value = '';
};

const start = () => {
  if (hasDuplicateKeys.value) {
    return;
  }

  emit('start', {
    sceneKey: 'DualLaneDriveScene',
    settings: getCurrentSettings(),
  });
};
</script>

<template>
  <section
    class="setup-panel"
    aria-label="Dual Lane Drive setup"
  >
    <div class="setup-row">
      <div>
        <h2>Car controls</h2>
        <p>Choose the keys that switch each car between its two lanes.</p>
      </div>
    </div>

    <section
      class="preset-panel"
      aria-label="Control presets"
    >
      <div class="preset-column">
        <span>Presets</span>
        <div
          class="preset-group"
          aria-label="Dual lane presets"
        >
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

      <div
        v-if="userPresets.length > 0"
        class="preset-column"
        aria-label="Saved presets"
      >
        <span>Saved</span>
        <div class="saved-preset-list">
          <div
            v-for="preset in userPresets"
            :key="preset.id"
            class="saved-preset"
          >
            <button
              type="button"
              @click="applyPreset(preset.value)"
            >
              {{ preset.name }}
            </button>
            <button
              type="button"
              class="saved-preset-delete"
              :aria-label="`Delete ${preset.name}`"
              @click="deletePreset(preset.id)"
            >
              -
            </button>
          </div>
        </div>
      </div>

      <label class="preset-save-field">
        <span>Save current</span>
        <span class="preset-save-control">
          <input
            v-model="presetName"
            type="text"
            placeholder="Preset name"
          >
          <button
            type="button"
            class="secondary-button"
            :disabled="hasDuplicateKeys || !presetName.trim()"
            @click="saveCurrentPreset"
          >
            Save preset
          </button>
        </span>
      </label>
    </section>

    <div class="field-grid">
      <label>
        <span>Left car</span>
        <select v-model="leftKey">
          <option
            v-for="key in keyOptions"
            :key="key"
            :value="key"
          >{{ key }}</option>
        </select>
      </label>

      <label>
        <span>Right car</span>
        <select v-model="rightKey">
          <option
            v-for="key in keyOptions"
            :key="key"
            :value="key"
          >{{ key }}</option>
        </select>
      </label>
    </div>

    <p
      v-if="hasDuplicateKeys"
      class="setup-error"
    >
      Choose two different keys.
    </p>

    <footer class="setup-actions">
      <button
        type="button"
        class="start-button"
        :disabled="hasDuplicateKeys"
        @click="start"
      >
        Start
      </button>
    </footer>
  </section>
</template>
