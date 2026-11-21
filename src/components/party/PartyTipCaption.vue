<template>
  <div
    v-if="tips.length"
    :class="
      cn(
        'pointer-events-none flex w-full max-w-[36rem] flex-col items-center gap-[0.8vh]',
        compact && 'max-w-full',
      )
    "
    role="status"
    aria-live="polite"
  >
    <!-- reserves two lines so a shorter tip doesn't resize the QR above it -->
    <div
      :class="
        cn(
          'flex min-h-[calc(2lh+1.2vh)] w-full items-center justify-center text-[clamp(0.8rem,1.6vh,1.4rem)] leading-snug',
          compact && 'text-[clamp(0.7rem,1.4vh,1.2rem)]',
        )
      "
    >
      <Transition name="tip" mode="out-in">
        <div
          :key="tip"
          :class="
            cn(
              'flex max-w-full items-center gap-[0.8vh] rounded-[1.8vh] border border-white/25 bg-white/10 px-[1.4vh] py-[0.5vh] font-medium text-white/85',
              !lightText && 'border-black/15 bg-black/5 text-foreground/80',
            )
          "
        >
          <component
            :is="TIP_ICONS[tip]"
            class="size-[clamp(14px,1.8vh,26px)] shrink-0"
            aria-hidden="true"
          />
          <span class="line-clamp-2">
            {{ $t(`providers.party.tips.${tip}`, partyTipValues(tip, config)) }}
          </span>
        </div>
      </Transition>
    </div>
    <div v-if="tips.length > 1" class="flex gap-[0.5vh]" aria-hidden="true">
      <span
        v-for="(dotTip, dot) in tips"
        :key="dotTip"
        :class="
          cn(
            'size-[0.6vh] rounded-full bg-current opacity-20 transition-opacity duration-500',
            dot === index && 'opacity-60',
          )
        "
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePartyConfig } from "@/composables/usePartyConfig";
import { type PartyTip, partyTips, partyTipValues } from "@/helpers/party_tips";
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
  guestAccess: boolean;
  queueEmpty: boolean;
  lightText: boolean;
  // narrower, smaller caption for the karaoke corner QR
  compact?: boolean;
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
const tips = computed(() =>
  partyTips(config.value, props.guestAccess, props.queueEmpty),
);

const index = ref(0);
const tip = computed(
  () => tips.value[index.value % Math.max(tips.value.length, 1)],
);

// a tip list that gets shorter can leave the index past its end
watch(tips, (list) => {
  if (index.value >= list.length) index.value = 0;
});

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => {
    index.value = (index.value + 1) % Math.max(tips.value.length, 1);
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
