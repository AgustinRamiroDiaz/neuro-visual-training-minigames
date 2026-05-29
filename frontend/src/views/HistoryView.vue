<script setup lang="ts">
import type { PlayHistoryRecord, PlayMetadataValue } from '../history/playHistory';
import { useHistoryStore } from '../stores/historyStore';

const historyStore = useHistoryStore();

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const getMetadataEntries = (record: PlayHistoryRecord) => Object.entries(record.metadata);

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime()) ? timestamp : timestampFormatter.format(date);
};

const formatMetadataLabel = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatMetadataValue = (value: PlayMetadataValue): string => {
  if (Array.isArray(value)) {
    return value.map(formatMetadataValue).join(', ');
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};
</script>

<template>
  <section class="history-view">
    <header class="catalog-header">
      <div>
        <p class="eyebrow">
          Session History
        </p>
        <h1>Review completed playthroughs.</h1>
      </div>
    </header>

    <DataTable
      v-if="historyStore.records.length > 0"
      :value="historyStore.records"
      class="history-list"
      aria-label="Play history"
      data-key="id"
      striped-rows
      size="small"
    >
      <Column
        field="timestamp"
        header="Played"
        sortable
      >
        <template #body="{ data }: { data: PlayHistoryRecord }">
          <span class="card-meta">{{ formatTimestamp(data.timestamp) }}</span>
        </template>
      </Column>

      <Column
        field="gameName"
        header="Minigame"
        sortable
      >
        <template #body="{ data }: { data: PlayHistoryRecord }">
          <strong class="history-game-name">{{ data.gameName }}</strong>
          <span class="history-game-id">{{ data.gameId }}</span>
        </template>
      </Column>

      <Column header="Metrics">
        <template #body="{ data }: { data: PlayHistoryRecord }">
          <dl
            v-if="getMetadataEntries(data).length > 0"
            class="history-metadata"
          >
            <template
              v-for="[key, value] in getMetadataEntries(data)"
              :key="key"
            >
              <dt>{{ formatMetadataLabel(key) }}</dt>
              <dd>{{ formatMetadataValue(value) }}</dd>
            </template>
          </dl>

          <span
            v-else
            class="history-empty-metadata"
          >
            No session metrics recorded.
          </span>
        </template>
      </Column>
    </DataTable>

    <p
      v-else
      class="empty-state"
    >
      Complete a minigame to add your first history record.
    </p>
  </section>
</template>
