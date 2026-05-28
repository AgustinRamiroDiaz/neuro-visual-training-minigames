export interface UserPreset<TValue> {
  id: string;
  name: string;
  value: TValue;
  createdAt: string;
  updatedAt: string;
}

export interface PresetStore {
  list<TValue>(namespace: string): Promise<Array<UserPreset<TValue>>>;
  save<TValue>(namespace: string, name: string, value: TValue): Promise<UserPreset<TValue>>;
  delete(namespace: string, presetId: string): Promise<void>;
}

const storagePrefix = 'neuro-visual-training:preset:';

const createPresetId = () => {
  if ('crypto' in window && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export class LocalStoragePresetStore implements PresetStore {
  async list<TValue>(namespace: string) {
    return this.read<TValue>(namespace);
  }

  async save<TValue>(namespace: string, name: string, value: TValue) {
    const presets = this.read<TValue>(namespace);
    const now = new Date().toISOString();
    const existingPreset = presets.find(
      (preset) => preset.name.toLowerCase() === name.trim().toLowerCase(),
    );

    if (existingPreset) {
      existingPreset.value = value;
      existingPreset.updatedAt = now;
      this.write(namespace, presets);
      return existingPreset;
    }

    const preset = {
      id: createPresetId(),
      name: name.trim(),
      value,
      createdAt: now,
      updatedAt: now,
    };

    presets.push(preset);
    this.write(namespace, presets);

    return preset;
  }

  async delete(namespace: string, presetId: string) {
    const presets = this.read(namespace).filter((preset) => preset.id !== presetId);
    this.write(namespace, presets);
  }

  private read<TValue>(namespace: string): Array<UserPreset<TValue>> {
    try {
      const rawValue = window.localStorage.getItem(`${storagePrefix}${namespace}`);

      if (!rawValue) {
        return [];
      }

      return JSON.parse(rawValue) as Array<UserPreset<TValue>>;
    } catch {
      return [];
    }
  }

  private write<TValue>(namespace: string, presets: Array<UserPreset<TValue>>) {
    window.localStorage.setItem(`${storagePrefix}${namespace}`, JSON.stringify(presets));
  }
}

export const presetStore: PresetStore = new LocalStoragePresetStore();
