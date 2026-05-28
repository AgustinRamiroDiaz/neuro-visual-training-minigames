export function normalizeKeyboardEventKey(key: string) {
  const normalized = key.length === 1 ? key.toUpperCase() : key.toUpperCase().replace('ARROW', '');

  return normalized === ' ' ? 'SPACE' : normalized;
}
