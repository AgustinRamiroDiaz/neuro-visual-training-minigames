<script setup lang="ts">
import type { Minigame } from '../data/minigames';

defineProps<{
  minigame: Minigame;
}>();
</script>

<template>
  <div class="preview" :style="{ '--accent': minigame.preview.accent }">
    <template v-if="minigame.preview.pattern === 'targets'">
      <span v-for="index in 16" :key="index" class="dot" :class="{ odd: index === 10 }" />
    </template>

    <template v-else-if="minigame.preview.pattern === 'pulse'">
      <span class="pulse outer" />
      <span class="pulse middle" />
      <span class="pulse core" />
    </template>

    <template v-else-if="minigame.preview.pattern === 'orbit'">
      <span class="orbit path" />
      <span class="orbit focus" />
      <span class="orbit satellite" />
    </template>

    <template v-else-if="minigame.preview.pattern === 'grid'">
      <span v-for="index in 12" :key="index" class="cell" :class="{ lit: [2, 6, 11].includes(index) }" />
    </template>

    <template v-else-if="minigame.preview.pattern === 'dual-lane'">
      <span class="road left-road" />
      <span class="road right-road" />
      <span class="mini-car left-car" />
      <span class="mini-car right-car" />
      <span class="mini-obstacle left-obstacle" />
      <span class="mini-obstacle right-obstacle" />
    </template>

    <template v-else>
      <span v-for="key in ['A', 'S', 'K', 'L']" :key="key" class="rhythm-lane">
        <span class="rhythm-note">{{ key }}</span>
      </span>
      <span class="instrument-line" />
    </template>
  </div>
</template>
