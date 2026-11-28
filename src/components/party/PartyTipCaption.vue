<template>
  <div
    class="pointer-events-none absolute inset-x-0 bottom-[var(--party-player-bottom,0px)] z-10 flex h-[var(--party-tip-bar)] items-center justify-center px-[2vw] text-[clamp(0.625rem,min(2.6vh,2.4vw),2.4rem)] leading-snug"
    role="status"
    aria-live="polite"
  >
    <Transition name="tip" mode="out-in">
      <div
        :key="tip"
        :class="
          cn(
            'flex max-w-full items-center gap-[0.6em] rounded-full border border-white/25 bg-white/10 px-[0.9em] py-[0.15em] font-medium text-white/85',
            !lightText && 'border-black/15 bg-black/5 text-foreground/80',
          )
        "
      >
        <component
          :is="TIP_ICONS[tip]"
          class="size-[1.1em] shrink-0"
          aria-hidden="true"
        />
        <span class="truncate">
          {{ $t(`providers.party.tips.${tip}`, partyTipValues(tip, config)) }}
        </span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { usePartyConfig } from "@/composables/usePartyConfig";
import { type PartyTip, partyTipValues } from "@/helpers/party_tips";
import { cn } from "@/lib/utils";
import { $t } from "@/plugins/i18n";
import {
  Headphones,
  Hourglass,
  type LucideIcon,
  Megaphone,
  MicVocal,
  QrCode,
  Rocket,
  SkipForward,
  SmilePlus,
  UserPen,
  Vote,
} from "@lucide/vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  tips: PartyTip[];
  lightText: boolean;
}>();

const TIP_MS = 12_000;
const TIP_ICONS: Record<PartyTip, LucideIcon> = {
  scan: QrCode,
  karaoke: MicVocal,
  silent_disco: Headphones,
  nickname: UserPen,
  boost: Rocket,
  request_refill: Hourglass,
  shout_out: Megaphone,
  skip: SkipForward,
  skip_votes: Vote,
  react: SmilePlus,
};

const { config } = usePartyConfig();
const index = ref(0);
const tip = computed(
  () => props.tips[index.value % Math.max(props.tips.length, 1)],
);

// a tip list that gets shorter can leave the index past its end
watch(
  () => props.tips,
  (list) => {
    if (index.value >= list.length) index.value = 0;
  },
);

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => {
    index.value = (index.value + 1) % Math.max(props.tips.length, 1);
  }, TIP_MS);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.tip-enter-active,
.tip-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.tip-enter-from {
  opacity: 0;
  transform: translateY(1vh);
}

.tip-leave-to {
  opacity: 0;
  transform: translateY(-1vh);
}
</style>
