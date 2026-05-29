import { onMounted, ref } from 'vue';
import { presetStore, type UserPreset } from './presetStore';

export function useStoredPresets<TValue>(namespace: string) {
  const presets = ref<UserPreset<TValue>[]>([]);

  const loadPresets = async () => {
    presets.value = await presetStore.list<TValue>(namespace);
  };

  const savePreset = async (name: string, value: TValue) => {
    if (!name.trim()) {
      return;
    }

    await presetStore.save(namespace, name, value);
    await loadPresets();
  };

  const deletePreset = async (presetId: string) => {
    await presetStore.delete(namespace, presetId);
    await loadPresets();
  };

  onMounted(() => {
    void loadPresets();
  });

  return {
    presets,
    savePreset,
    deletePreset,
  };
}
