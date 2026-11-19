<template>
  <div
    v-if="slides.length"
    class="pointer-events-none absolute z-10 max-w-[min(42vw,36rem)]"
    :style="{
      bottom: 'var(--party-player-bottom)',
      left: 'var(--party-player-right)',
    }"
    role="status"
    aria-live="polite"
  >
    <Transition name="ticker" mode="out-in">
      <div
        v-if="slide?.kind === 'leaderboard'"
        key="leaderboard"
        :class="panelClass"
      >
        <div class="mb-[0.8vh] flex items-center gap-[1vh] font-bold">
          <Trophy class="size-[2.6vh]" aria-hidden="true" />
          <span class="text-[clamp(1rem,2.2vh,2rem)]">
            {{ $t("providers.party.leaderboard_title") }}
          </span>
        </div>
        <ol class="flex flex-col gap-[0.4vh]">
          <li
            v-for="(entry, rank) in leaderboard"
            :key="entry.name"
            class="flex items-center gap-[1vh] text-[clamp(0.85rem,1.8vh,1.6rem)]"
          >
            <span class="w-[3vh] text-center">{{ medal(rank) }}</span>
            <span class="min-w-0 flex-1 truncate font-semibold">
              {{ entry.name }}
            </span>
            <span class="shrink-0 opacity-75">
              {{ $t("providers.party.leaderboard_requests", [entry.requests]) }}
              <template v-if="entry.boosts">
                ·
                {{ $t("providers.party.leaderboard_boosts", [entry.boosts]) }}
              </template>
            </span>
          </li>
        </ol>
      </div>
      <div
        v-else-if="slide?.kind === 'tip'"
        :key="slide.tip"
        :class="[panelClass, 'flex items-center gap-[1vh]']"
      >
        <Lightbulb class="size-[2.4vh] shrink-0" aria-hidden="true" />
        <span class="text-[clamp(0.9rem,2vh,1.8rem)]">
          {{ $t(`providers.party.tips.${slide.tip}`) }}
        </span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  type PartyTickerSlide,
  type PartyTip,
  partyTickerSlides,
} from "@/helpers/party_tips";
import { cn } from "@/lib/utils";
import type { PartyLeaderboardEntry } from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import { Lightbulb, Trophy } from "@lucide/vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  tips: PartyTip[];
  leaderboard: PartyLeaderboardEntry[];
  showLeaderboard: boolean;
  lightText: boolean;
}>();

const SLIDE_MS = 12_000;
// The leaderboard comes back after every this many tips
const TIPS_BETWEEN_LEADERBOARDS = 2;
const MEDALS = ["🥇", "🥈", "🥉"];

const panelClass = computed(() =>
  cn(
    "rounded-[1.2vh] bg-black/35 px-[1.6vh] py-[1.2vh] text-white backdrop-blur-md",
    !props.lightText && "bg-white/55 text-foreground",
  ),
);

const slides = computed<PartyTickerSlide[]>(() =>
  partyTickerSlides(
    props.tips,
    props.showLeaderboard && props.leaderboard.length > 0,
    TIPS_BETWEEN_LEADERBOARDS,
  ),
);

const index = ref(0);
const slide = computed(
  () => slides.value[index.value % Math.max(slides.value.length, 1)],
);

const medal = (position: number) => MEDALS[position] ?? `${position + 1}.`;

// a slide list that changes length can leave the index past its end
watch(slides, (list) => {
  if (index.value >= list.length) index.value = 0;
});

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => {
    index.value = (index.value + 1) % Math.max(slides.value.length, 1);
  }, SLIDE_MS);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.ticker-enter-active,
.ticker-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.ticker-enter-from {
  opacity: 0;
  transform: translateY(1.5vh);
}

.ticker-leave-to {
  opacity: 0;
  transform: translateY(-1.5vh);
}
</style>
