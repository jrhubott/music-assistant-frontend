<template>
  <section
    v-if="reactions.length"
    class="mt-3 flex shrink-0 flex-col items-center gap-1"
    :aria-label="$t('providers.party.guest_page.reactions_title')"
  >
    <span class="text-xs text-muted-foreground">
      {{ $t("providers.party.guest_page.reactions_title") }}
    </span>
    <div class="flex flex-wrap justify-center gap-1">
      <button
        v-for="emoji in reactions"
        :key="emoji"
        type="button"
        :class="[
          'reaction-button flex size-11 items-center justify-center rounded-full text-2xl transition-colors hover:bg-accent',
          { 'reaction-button--sent': lastSent === emoji },
        ]"
        :aria-label="$t('providers.party.guest_page.reaction_label', [emoji])"
        @click="react(emoji)"
        @animationend="lastSent = ''"
      >
        {{ emoji }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { usePartyConfig } from "@/composables/usePartyConfig";
import api from "@/plugins/api";
import { $t } from "@/plugins/i18n";
import { computed, ref } from "vue";
import { toast } from "vue-sonner";

const { config } = usePartyConfig();

const reactions = computed(() =>
  config.value?.enable_reactions ? config.value.reactions : [],
);
// The button pops when its reaction is sent, which is the guest's feedback:
// a toast for every tap would bury the page while someone taps away
const lastSent = ref("");

const react = async (emoji: string) => {
  lastSent.value = "";
  try {
    await api.sendCommand("party/react", { emoji });
    lastSent.value = emoji;
  } catch (error) {
    console.error("Failed to send reaction:", error);
    toast.error($t("providers.party.guest_page.reaction_failed"));
  }
};
</script>

<style scoped>
.reaction-button--sent {
  animation: reaction-pop 0.35s ease-out;
}

@keyframes reaction-pop {
  50% {
    transform: scale(1.35);
  }
}
</style>
