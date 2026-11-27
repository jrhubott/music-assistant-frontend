<template>
  <div class="flex items-center gap-2">
    <Button
      size="icon-sm"
      variant="ghost"
      :aria-label="$t('providers.party.guest_page.host_mute_speaker', [label])"
      :aria-pressed="muted"
      @click="emit('set-muted', !muted)"
    >
      <VolumeX v-if="muted" :size="16" />
      <Volume2 v-else :size="16" />
    </Button>
    <span class="w-24 shrink-0 truncate text-xs">{{ label }}</span>
    <Slider
      class="flex-1"
      :model-value="[draft ?? level]"
      :max="max"
      :step="1"
      :thumb-label="label"
      @update:model-value="draft = $event?.[0] ?? null"
      @value-commit="commit"
    />
    <span class="w-8 text-right text-xs tabular-nums">{{
      draft ?? level
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { $t } from "@/plugins/i18n";
import { Volume2, VolumeX } from "@lucide/vue";
import { ref } from "vue";

defineProps<{ label: string; level: number; muted: boolean; max: number }>();
const emit = defineEmits<{ "set-level": [number]; "set-muted": [boolean] }>();

const draft = ref<number | null>(null);

const commit = (value: number[]) => {
  if (value[0] !== undefined) emit("set-level", value[0]);
  draft.value = null;
};
</script>
