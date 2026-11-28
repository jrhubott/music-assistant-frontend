<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-center gap-1">
      <Button
        size="icon-sm"
        :variant="queue?.shuffle_enabled ? 'default' : 'ghost'"
        :aria-label="$t('providers.party.guest_page.host_shuffle')"
        :aria-pressed="!!queue?.shuffle_enabled"
        @click="setShuffle(!queue?.shuffle_enabled)"
      >
        <Shuffle :size="16" />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        :aria-label="$t('providers.party.guest_page.host_previous')"
        @click="previous"
      >
        <SkipBack :size="18" />
      </Button>
      <Button
        size="icon"
        :aria-label="$t('providers.party.guest_page.host_pause_play')"
        @click="playPause"
      >
        <Pause v-if="isPlaying" :size="20" />
        <Play v-else :size="20" />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        :aria-label="$t('providers.party.guest_page.host_next')"
        @click="next"
      >
        <SkipForward :size="18" />
      </Button>
      <Button
        size="icon-sm"
        :variant="repeatMode === RepeatMode.OFF ? 'ghost' : 'default'"
        :aria-label="$t('providers.party.guest_page.host_repeat')"
        @click="setRepeat(nextRepeat)"
      >
        <Repeat1 v-if="repeatMode === RepeatMode.ONE" :size="16" />
        <Repeat v-else :size="16" />
      </Button>
    </div>
    <Slider
      v-if="duration > 0"
      :model-value="[draft ?? elapsed]"
      :max="duration"
      :step="1"
      :thumb-label="$t('providers.party.guest_page.host_seek')"
      @update:model-value="draft = $event?.[0] ?? null"
      @value-commit="commit"
    />
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePartyHost } from "@/composables/party/usePartyHost";
import {
  PlaybackState,
  type PlayerQueue,
  RepeatMode,
} from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "@lucide/vue";
import { useIntervalFn } from "@vueuse/core";
import { computed, ref } from "vue";

const ELAPSED_TICK_MS = 1000;
const REPEAT_ORDER = [RepeatMode.OFF, RepeatMode.ALL, RepeatMode.ONE];

const props = defineProps<{ queue: PlayerQueue | null | undefined }>();

const { playPause, next, previous, seek, setShuffle, setRepeat } =
  usePartyHost();
const now = ref(Date.now());
useIntervalFn(() => (now.value = Date.now()), ELAPSED_TICK_MS);
const draft = ref<number | null>(null);

const isPlaying = computed(() => props.queue?.state === PlaybackState.PLAYING);
const repeatMode = computed(() => props.queue?.repeat_mode ?? RepeatMode.OFF);
const nextRepeat = computed(
  () =>
    REPEAT_ORDER[
      (REPEAT_ORDER.indexOf(repeatMode.value) + 1) % REPEAT_ORDER.length
    ] ?? RepeatMode.OFF,
);
const duration = computed(() => props.queue?.current_item?.duration ?? 0);
const elapsed = computed(() => {
  const base = props.queue?.elapsed_time ?? 0;
  const updated = props.queue?.elapsed_time_last_updated;
  const running = isPlaying.value && updated ? now.value / 1000 - updated : 0;
  return Math.min(duration.value, Math.round(base + Math.max(0, running)));
});

const commit = async (value: number[]) => {
  const position = value[0];
  if (position !== undefined) await seek(position);
  draft.value = null;
};
</script>
