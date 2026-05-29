export interface UserPreset<TValue> {
  id: string;
  name: string;
  value: TValue;
  createdAt: string;
  updatedAt: string;
}

export interface PresetStore {
  list<TValue>(namespace: string): Promise<UserPreset<TValue>[]>;
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
  list<TValue>(namespace: string) {
    return Promise.resolve(this.read<TValue>(namespace));
  }

  save<TValue>(namespace: string, name: string, value: TValue) {
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

    return Promise.resolve(preset);
  }

  delete(namespace: string, presetId: string) {
    const presets = this.read(namespace).filter((preset) => preset.id !== presetId);
    this.write(namespace, presets);
    return Promise.resolve();
  }

  private read<TValue>(namespace: string): UserPreset<TValue>[] {
    try {
      const rawValue = window.localStorage.getItem(`${storagePrefix}${namespace}`);

      if (!rawValue) {
        return [];
      }

      return JSON.parse(rawValue) as UserPreset<TValue>[];
    } catch {
      return [];
    }
  }

  private write<TValue>(namespace: string, presets: UserPreset<TValue>[]) {
    window.localStorage.setItem(`${storagePrefix}${namespace}`, JSON.stringify(presets));
  }
}

export const presetStore: PresetStore = new LocalStoragePresetStore();
