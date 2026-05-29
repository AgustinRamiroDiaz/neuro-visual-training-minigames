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
        <ButtonGroup
          class="preset-group"
          aria-label="Dual lane presets"
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

    <div class="field-grid">
      <label>
        <span>Left car</span>
        <Select
          v-model="leftKey"
          :options="[...keyOptions]"
        />
      </label>

      <label>
        <span>Right car</span>
        <Select
          v-model="rightKey"
          :options="[...keyOptions]"
        />
      </label>
    </div>

    <Message
      v-if="hasDuplicateKeys"
      class="setup-error"
      severity="error"
      size="small"
      icon="none"
    >
      Choose two different keys.
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
