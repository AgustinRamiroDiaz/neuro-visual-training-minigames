<script setup lang="ts">
import type { Minigame } from '../data/minigames';

defineProps<{
  minigame: Minigame;
}>();

const targetDots = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  cx: 66 + (index % 4) * 28,
  cy: 34 + Math.floor(index / 4) * 24,
}));

const gridCells = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  x: 54 + (index % 4) * 34,
  y: 30 + Math.floor(index / 4) * 30,
  lit: [1, 5, 10].includes(index),
}));

const rhythmNotes = [
  { key: 'A', x: 66, y: 20 },
  { key: 'S', x: 94, y: 48 },
  { key: 'K', x: 122, y: 30 },
  { key: 'L', x: 150, y: 68 },
];
</script>

<template>
  <svg
    class="preview"
    viewBox="0 0 240 150"
    role="img"
    :aria-label="`${minigame.title} preview`"
    :style="{ '--accent': minigame.preview.accent }"
  >
    <defs>
      <radialGradient
        id="previewGlow"
        cx="30%"
        cy="20%"
        r="55%"
      >
        <stop
          offset="0%"
          stop-color="var(--p-content-background)"
        />
        <stop
          offset="100%"
          stop-color="var(--p-surface-200)"
        />
      </radialGradient>
    </defs>

    <rect
      width="240"
      height="150"
      fill="url(#previewGlow)"
    />

    <template v-if="minigame.preview.pattern === 'targets'">
      <circle
        v-for="dot in targetDots"
        :key="dot.id"
        :cx="dot.cx"
        :cy="dot.cy"
        :r="dot.id === 9 ? 8 : 6"
        :fill="dot.id === 9 ? 'var(--accent)' : 'var(--p-surface-300)'"
      />
    </template>

    <template v-else-if="minigame.preview.pattern === 'pulse'">
      <circle
        cx="120"
        cy="75"
        r="56"
        fill="none"
        stroke="var(--p-content-border-color)"
        stroke-width="2"
      />
      <circle
        cx="120"
        cy="75"
        r="37"
        fill="var(--accent)"
        opacity="0.25"
      />
      <circle
        cx="120"
        cy="75"
        r="17"
        fill="var(--accent)"
      />
    </template>

    <template v-else-if="minigame.preview.pattern === 'orbit'">
      <circle
        cx="120"
        cy="75"
        r="53"
        fill="none"
        stroke="var(--accent)"
        stroke-width="2"
        opacity="0.48"
      />
      <circle
        cx="120"
        cy="75"
        r="9"
        fill="var(--p-surface-900)"
      />
      <circle
        cx="168"
        cy="47"
        r="11"
        fill="var(--accent)"
      />
    </template>

    <template v-else-if="minigame.preview.pattern === 'grid'">
      <rect
        v-for="cell in gridCells"
        :key="cell.id"
        :x="cell.x"
        :y="cell.y"
        width="26"
        height="26"
        rx="5"
        :fill="cell.lit ? 'var(--accent)' : 'var(--p-surface-300)'"
      />
    </template>

    <template v-else-if="minigame.preview.pattern === 'dual-lane'">
      <rect
        x="82"
        y="15"
        width="54"
        height="120"
        rx="4"
        fill="var(--p-surface-900)"
      />
      <rect
        x="150"
        y="15"
        width="54"
        height="120"
        rx="4"
        fill="var(--p-surface-900)"
      />
      <rect
        x="96"
        y="92"
        width="22"
        height="34"
        rx="5"
        fill="var(--accent)"
      />
      <rect
        x="164"
        y="92"
        width="22"
        height="34"
        rx="5"
        fill="var(--accent)"
      />
      <rect
        x="116"
        y="33"
        width="22"
        height="28"
        rx="5"
        fill="var(--p-content-background)"
      />
      <rect
        x="182"
        y="33"
        width="22"
        height="28"
        rx="5"
        fill="var(--p-content-background)"
      />
    </template>

    <template v-else>
      <g
        v-for="note in rhythmNotes"
        :key="note.key"
      >
        <rect
          :x="note.x"
          y="12"
          width="28"
          height="126"
          rx="4"
          fill="var(--p-surface-900)"
        />
        <rect
          :x="note.x + 3"
          :y="note.y"
          width="22"
          height="22"
          rx="5"
          fill="var(--accent)"
        />
        <text
          :x="note.x + 14"
          :y="note.y + 15"
          text-anchor="middle"
          fill="var(--p-primary-contrast-color)"
          font-size="10"
          font-weight="800"
        >
          {{ note.key }}
        </text>
      </g>
      <rect
        x="52"
        y="118"
        width="136"
        height="4"
        fill="var(--p-surface-50)"
      />
    </template>
  </svg>
</template>
