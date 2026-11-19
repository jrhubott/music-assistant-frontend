<template>
  <div class="pointer-events-none absolute inset-0 z-20">
    <PartyReactionLayer ref="reactionLayer" />
    <PartyRequestBanner
      ref="requestBanner"
      :request-badge-color="requestBadgeColor"
      :boost-badge-color="boostBadgeColor"
    />
    <PartyInfoTicker
      :tips="tips"
      :leaderboard="leaderboard"
      :show-leaderboard="config?.show_leaderboard ?? false"
      :light-text="lightText"
    />
  </div>
</template>

<script setup lang="ts">
import PartyInfoTicker from "@/components/party/PartyInfoTicker.vue";
import PartyReactionLayer from "@/components/party/PartyReactionLayer.vue";
import PartyRequestBanner from "@/components/party/PartyRequestBanner.vue";
import { usePartyScreenEvents } from "@/composables/party/usePartyScreenEvents";
import { usePartyConfig } from "@/composables/usePartyConfig";
import { partyTips } from "@/helpers/party_tips";
import { computed, toRef, useTemplateRef } from "vue";

const props = defineProps<{
  partyInstanceId: string | undefined;
  guestAccess: boolean;
  lightText: boolean;
  requestBadgeColor: string;
  boostBadgeColor: string;
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

const tips = computed(() => partyTips(config.value, props.guestAccess));
</script>
