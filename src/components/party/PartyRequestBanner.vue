<template>
  <div
    class="pointer-events-none absolute inset-x-0 top-[6vh] z-20 flex justify-center"
    role="status"
    aria-live="polite"
  >
    <Transition name="request-banner">
      <div
        v-if="current"
        :key="current.id"
        class="flex max-w-[80vw] items-center gap-[1.2vh] rounded-full px-[2.4vh] py-[1.2vh] text-white shadow-2xl"
        :style="{ background: bannerColor }"
      >
        <Rocket
          v-if="current.boosted"
          class="size-[3vh] shrink-0 animate-bounce"
          aria-hidden="true"
        />
        <Sparkles v-else class="size-[3vh] shrink-0" aria-hidden="true" />
        <span class="shrink-0 text-[clamp(1rem,2.4vh,2.2rem)] font-bold">
          {{ headline }}
        </span>
        <span class="truncate text-[clamp(1rem,2.4vh,2.2rem)] opacity-90">
          {{ current.title }}
        </span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { PartyProviderEvent } from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import { Rocket, Sparkles } from "@lucide/vue";
import Color from "color";
import { computed, onBeforeUnmount, ref } from "vue";

type GuestRequest = Extract<PartyProviderEvent, { event: "guest_request" }>;

interface Announcement {
  id: number;
  title: string;
  name: string | null;
  boosted: boolean;
}

const props = defineProps<{
  requestBadgeColor: string;
  boostBadgeColor: string;
}>();

const SHOW_MS = 4500;
// Requests arriving while one shows wait their turn, up to this many
const MAX_WAITING = 5;

const current = ref<Announcement | null>(null);
const waiting: Announcement[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let nextId = 0;

const headline = computed(() => {
  const item = current.value;
  if (!item) return "";
  if (item.boosted) {
    return item.name
      ? $t("providers.party.new_boost", [item.name])
      : $t("providers.party.new_boost_anonymous");
  }
  return item.name
    ? $t("providers.party.new_request", [item.name])
    : $t("providers.party.new_request_anonymous");
});

const bannerColor = computed(() => {
  const color = current.value?.boosted
    ? props.boostBadgeColor
    : props.requestBadgeColor;
  try {
    return Color(color).alpha(0.9).string();
  } catch {
    return "rgba(0, 0, 0, 0.75)";
  }
});

const showNext = () => {
  current.value = waiting.shift() ?? null;
  timer = current.value ? setTimeout(showNext, SHOW_MS) : null;
};

const announce = (request: GuestRequest) => {
  if (waiting.length >= MAX_WAITING) return;
  waiting.push({
    id: nextId++,
    title: request.title,
    name: request.name,
    boosted: request.boosted,
  });
  if (!timer) showNext();
};

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
});

defineExpose({ announce });
</script>

<style scoped>
.request-banner-enter-active,
.request-banner-leave-active {
  transition:
    transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.4s ease;
}

.request-banner-enter-from {
  transform: translateY(-4vh) scale(0.8);
  opacity: 0;
}

.request-banner-leave-to {
  transform: translateY(-2vh);
  opacity: 0;
}
</style>
