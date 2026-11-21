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
    <Transition name="tip" mode="out-in">
      <div
        :key="tip"
        :class="
          cn(
            'flex w-full items-center gap-[1.2vh] rounded-[1.2vh] bg-black/35 px-[1.6vh] py-[1vh] text-white backdrop-blur-md',
            !lightText && 'bg-white/55 text-foreground',
          )
        "
      >
        <component
          :is="TIP_ICONS[tip]"
          :class="cn('size-[3.2vh] shrink-0', compact && 'size-[2.6vh]')"
          aria-hidden="true"
        />
        <span
          :class="
            cn(
              'line-clamp-2 min-h-[2lh] content-center text-[clamp(1rem,2.6vh,2.4rem)] leading-snug font-medium',
              compact && 'text-[clamp(0.9rem,2vh,1.6rem)]',
            )
          "
        >
          {{ $t(`providers.party.tips.${tip}`) }}
        </span>
      </div>
    </Transition>
    <div v-if="tips.length > 1" class="flex gap-[0.6vh]" aria-hidden="true">
      <span
        v-for="(dotTip, dot) in tips"
        :key="dotTip"
        :class="
          cn(
            'size-[0.8vh] rounded-full bg-current opacity-30 transition-opacity duration-500',
            dot === index && 'opacity-90',
          )
        "
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePartyConfig } from "@/composables/usePartyConfig";
import { type PartyTip, partyTips } from "@/helpers/party_tips";
import { cn } from "@/lib/utils";
import { $t } from "@/plugins/i18n";
import {
  type LucideIcon,
  Megaphone,
  QrCode,
  Rocket,
  SkipForward,
  SmilePlus,
  UserPen,
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
  nickname: UserPen,
  boost: Rocket,
  shout_out: Megaphone,
  skip: SkipForward,
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
