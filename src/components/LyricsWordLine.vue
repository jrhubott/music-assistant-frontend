<template>
  <span
    v-for="(word, index) in words"
    :key="index"
    class="lyrics-word"
    :style="wordStyles[index]"
    >{{ word.text }}</span
  >
</template>

<script setup lang="ts">
import { type LyricWord, wordFillPercent } from "@/helpers/lyricWordTiming";
import { computed } from "vue";

interface Props {
  words: LyricWord[];
  position: number;
  /** Color of the sung part of a word. */
  sungColor: string;
  /** Color of the part still to be sung. */
  unsungColor: string;
}

const props = defineProps<Props>();

// Each word is a left-to-right wipe from the unsung to the sung color, the
// same text-clipped gradient the musical break notes fill with.
const wordStyles = computed(() =>
  props.words.map((word) => {
    const fill = wordFillPercent(word, props.position);
    return {
      backgroundImage: `linear-gradient(to right, ${props.sungColor} ${fill}%, ${props.unsungColor} ${fill}%)`,
    };
  }),
);
</script>

<style scoped>
.lyrics-word {
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: pre-wrap;
}
</style>
