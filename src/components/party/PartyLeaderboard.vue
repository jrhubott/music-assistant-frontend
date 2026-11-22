<template>
  <section
    v-if="rows.length"
    ref="card"
    :class="
      cn(
        'pointer-events-none absolute z-10 w-[clamp(14rem,19vw,24rem)] rounded-[1.2vh] bg-black/35 px-[1.6vh] py-[1.2vh] text-white backdrop-blur-md',
        !lightText && 'bg-white/55 text-foreground',
      )
    "
    :style="{
      bottom: 'calc(var(--party-player-bottom) + var(--party-tip-bar, 0px))',
      left: 'var(--party-player-right)',
    }"
    :aria-label="$t('providers.party.leaderboard_title')"
  >
    <div class="mb-[0.8vh] flex items-center gap-[1vh] font-bold">
      <Trophy class="size-[2.8vh] shrink-0" aria-hidden="true" />
      <span class="truncate text-[clamp(1rem,2.4vh,2.2rem)]">
        {{ $t("providers.party.leaderboard_title") }}
      </span>
    </div>
    <TransitionGroup tag="ol" name="rank" class="flex flex-col gap-[0.4vh]">
      <li
        v-for="(entry, rank) in rows"
        :key="entry.name"
        class="flex items-center gap-[1vh] text-[clamp(0.9rem,2vh,1.8rem)]"
      >
        <span class="w-[3vh] shrink-0 text-center">{{ medal(rank) }}</span>
        <span class="min-w-0 flex-1 truncate font-semibold">
          {{ entry.name }}
        </span>
        <span
          class="flex shrink-0 items-center gap-[0.5vh] tabular-nums opacity-75"
          :aria-label="stats(entry)"
        >
          <ListMusic class="size-[2vh]" aria-hidden="true" />
          <span aria-hidden="true">{{ entry.requests }}</span>
          <template v-if="entry.boosts">
            <Rocket class="ml-[0.5vh] size-[2vh]" aria-hidden="true" />
            <span aria-hidden="true">{{ entry.boosts }}</span>
          </template>
        </span>
      </li>
    </TransitionGroup>
  </section>
</template>

<script setup lang="ts">
import { cn } from "@/lib/utils";
import type { PartyLeaderboardEntry } from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import { ListMusic, Rocket, Trophy } from "@lucide/vue";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  useTemplateRef,
  watch,
} from "vue";

const props = defineProps<{
  leaderboard: PartyLeaderboardEntry[];
  lightText: boolean;
}>();

const emit = defineEmits<{
  // px from the card's top edge to the bottom of the screen, 0 when hidden,
  // so the dashboard can keep its QR column clear of the card
  space: [px: number];
}>();

// rows kept short so the card stays in the corner, clear of the track stack
const MAX_ROWS = 5;
const MEDALS = ["🥇", "🥈", "🥉"];

const rows = computed(() => props.leaderboard.slice(0, MAX_ROWS));

const GAP_PX = 12;
const card = useTemplateRef<HTMLElement>("card");

const measure = () => {
  const el = card.value;
  const parent = el?.offsetParent as HTMLElement | null | undefined;
  emit("space", el && parent ? parent.clientHeight - el.offsetTop + GAP_PX : 0);
};

let observer: ResizeObserver | null = null;
watch(card, (el, old) => {
  if (old) observer?.unobserve(old);
  if (el) observer?.observe(el);
  measure();
});
onMounted(() => {
  observer = new ResizeObserver(measure);
  if (card.value) observer.observe(card.value);
  window.addEventListener("resize", measure);
  measure();
});
onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener("resize", measure);
  emit("space", 0);
});

const medal = (position: number) => MEDALS[position] ?? `${position + 1}.`;

const stats = (entry: PartyLeaderboardEntry) =>
  [
    $t("providers.party.leaderboard_requests", [entry.requests]),
    entry.boosts
      ? $t("providers.party.leaderboard_boosts", [entry.boosts])
      : null,
  ]
    .filter(Boolean)
    .join(", ");
</script>

<style scoped>
.rank-move {
  transition: transform 0.6s ease;
}
</style>
