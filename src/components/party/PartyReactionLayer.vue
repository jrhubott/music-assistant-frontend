<template>
  <div
    class="pointer-events-none absolute inset-0 overflow-hidden"
    aria-hidden="true"
  >
    <span
      v-for="reaction in reactions"
      :key="reaction.id"
      class="floating-reaction"
      :style="{
        left: `${reaction.left}%`,
        '--drift': `${reaction.drift}vw`,
        '--duration': `${reaction.duration}s`,
      }"
      @animationend="remove(reaction.id)"
    >
      {{ reaction.emoji }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface FloatingReaction {
  id: number;
  emoji: string;
  left: number;
  drift: number;
  duration: number;
}

// Keeps a burst of taps from flooding the screen (and the TV's GPU)
const MAX_ON_SCREEN = 40;
// Reactions start somewhere along the lower right, away from the QR code
const LEFT_MIN_PERCENT = 55;
const LEFT_RANGE_PERCENT = 40;
const MAX_DRIFT_VW = 6;
const MIN_DURATION_S = 3.5;
const DURATION_RANGE_S = 2;

const reactions = ref<FloatingReaction[]>([]);
let nextId = 0;

const add = (emoji: string) => {
  if (reactions.value.length >= MAX_ON_SCREEN) return;
  reactions.value.push({
    id: nextId++,
    emoji,
    left: LEFT_MIN_PERCENT + Math.random() * LEFT_RANGE_PERCENT,
    drift: (Math.random() * 2 - 1) * MAX_DRIFT_VW,
    duration: MIN_DURATION_S + Math.random() * DURATION_RANGE_S,
  });
};

const remove = (id: number) => {
  reactions.value = reactions.value.filter((reaction) => reaction.id !== id);
};

defineExpose({ add });
</script>

<style scoped>
.floating-reaction {
  position: absolute;
  bottom: -8vh;
  font-size: clamp(2rem, 6vh, 5rem);
  animation: float-up var(--duration) ease-out forwards;
  will-change: transform, opacity;
}

@keyframes float-up {
  0% {
    transform: translate(0, 0) scale(0.6);
    opacity: 0;
  }
  10% {
    transform: translate(0, -8vh) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--drift), -85vh) scale(1);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-reaction {
    animation-name: fade-in-out;
  }

  @keyframes fade-in-out {
    0%,
    100% {
      opacity: 0;
      transform: translateY(-20vh);
    }
    20%,
    80% {
      opacity: 1;
      transform: translateY(-20vh);
    }
  }
}
</style>
