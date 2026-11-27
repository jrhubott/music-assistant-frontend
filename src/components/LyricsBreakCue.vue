<template>
  <span class="lyrics-cue" aria-hidden="true">
    <span
      v-for="dot in CUE_SECONDS"
      :key="dot"
      :class="[
        'lyrics-cue__dot',
        { 'lyrics-cue__dot--lit': dot <= secondsLeft },
      ]"
    ></span>
  </span>
</template>

<script setup lang="ts">
import { CUE_SECONDS } from "@/helpers/lyricBreakCue";

interface Props {
  /** Whole seconds left before the line is sung; one dot goes out per second. */
  secondsLeft: number;
  color: string;
}

defineProps<Props>();
</script>

<style scoped>
/* Centred on its line's top edge, in the gap above the text, without taking
   space, so the lyrics never shift. */
.lyrics-cue {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 0.45em;
  pointer-events: none;
}

.lyrics-cue__dot {
  width: 0.32em;
  height: 0.32em;
  border-radius: 50%;
  background: v-bind(color);
  opacity: 0.2;
  transition: opacity 0.2s ease;
}

.lyrics-cue__dot--lit {
  opacity: 1;
}
</style>
