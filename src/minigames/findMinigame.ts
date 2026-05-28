import { minigames } from './registry';

export function findMinigameById(gameId: string) {
  return minigames.find((game) => game.id === gameId) ?? null;
}
