import { defineStore } from 'pinia';
import type { Minigame } from '../minigames/types';
import {
  createPlayHistoryRecord,
  loadPlayHistory,
  savePlayHistory,
  type GameFinishedPayload,
  type PlayHistoryRecord,
} from '../history/playHistory';

interface HistoryState {
  records: PlayHistoryRecord[];
}

export const useHistoryStore = defineStore('history', {
  state: (): HistoryState => ({
    records: loadPlayHistory(),
  }),
  getters: {
    count: (state) => state.records.length,
    lastPlayedByGameId: (state) =>
      state.records.reduce<Record<string, string>>((latestByGame, record) => {
        const latestTimestamp = latestByGame[record.gameId];

        if (!latestTimestamp || record.timestamp > latestTimestamp) {
          latestByGame[record.gameId] = record.timestamp;
        }

        return latestByGame;
      }, {}),
  },
  actions: {
    addPlaythrough(minigame: Minigame, payload: GameFinishedPayload) {
      this.records = [createPlayHistoryRecord(minigame, payload), ...this.records];
      savePlayHistory(this.records);
    },
  },
});
