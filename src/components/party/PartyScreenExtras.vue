<template>
  <div class="pointer-events-none absolute inset-0 z-20">
    <PartyReactionLayer ref="reactionLayer" />
    <PartyRequestBanner
      ref="requestBanner"
      :request-badge-color="requestBadgeColor"
      :boost-badge-color="boostBadgeColor"
    />
    <PartyLeaderboard
      v-if="config?.show_leaderboard"
      :leaderboard="leaderboard"
      :light-text="lightText"
      @space="emit('leaderboard-space', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import PartyLeaderboard from "@/components/party/PartyLeaderboard.vue";
import PartyReactionLayer from "@/components/party/PartyReactionLayer.vue";
import PartyRequestBanner from "@/components/party/PartyRequestBanner.vue";
import { usePartyScreenEvents } from "@/composables/party/usePartyScreenEvents";
import { usePartyConfig } from "@/composables/usePartyConfig";
import { toRef, useTemplateRef } from "vue";

const props = defineProps<{
  partyInstanceId: string | undefined;
  lightText: boolean;
  requestBadgeColor: string;
  boostBadgeColor: string;
}>();

const emit = defineEmits<{
  "leaderboard-space": [px: number];
}>();

const { config } = usePartyConfig();
const reactionLayer = useTemplateRef("reactionLayer");
const requestBanner = useTemplateRef("requestBanner");

const { leaderboard } = usePartyScreenEvents(toRef(props, "partyInstanceId"), {
  onReaction: (emoji) => {
    if (config.value?.enable_reactions) reactionLayer.value?.add(emoji);
  },
  onGuestRequest: (request) => {
    if (config.value?.show_request_animations) {
      requestBanner.value?.announce(request);
    }
  },
});
</script>
