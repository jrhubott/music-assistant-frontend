<template>
  <div class="flex flex-col gap-4 border-t pt-3">
    <PartyHostPlayback :queue="queue" />
    <PartyHostVolume />

    <form class="flex gap-2" @submit.prevent="sendMessage">
      <Input
        v-model="message"
        class="flex-1"
        :maxlength="MESSAGE_MAX_LENGTH"
        :placeholder="$t('providers.party.guest_page.host_message_placeholder')"
        :aria-label="$t('providers.party.guest_page.host_message')"
      />
      <Button type="submit" :disabled="busy || !message.trim()">
        {{ $t("providers.party.guest_page.host_message_send") }}
      </Button>
    </form>

    <div class="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" :disabled="busy" @click="resetTokens">
        {{ $t("providers.party.guest_page.host_reset_tokens") }}
      </Button>
      <Button
        size="sm"
        variant="outline"
        :disabled="busy"
        @click="confirmClear = true"
      >
        {{ $t("providers.party.guest_page.host_clear_queue") }}
      </Button>
    </div>

    <div v-if="status.blocked_guests.length" class="flex flex-col gap-1">
      <h3 class="text-xs font-semibold">
        {{ $t("providers.party.guest_page.host_guests") }}
      </h3>
      <div
        v-for="(guest, index) in status.blocked_guests"
        :key="guest.guest_id"
        class="flex items-center justify-between gap-2 text-sm"
      >
        <span class="truncate">{{
          guest.name ||
          $t("providers.party.guest_page.host_unnamed_guest", [index + 1])
        }}</span>
        <Button
          size="sm"
          variant="ghost"
          :disabled="busy"
          @click="unblockGuest(guest.guest_id)"
        >
          {{ $t("providers.party.guest_page.host_unblock_one") }}
        </Button>
      </div>
      <Button
        v-if="status.blocked_guests.length > 1"
        size="sm"
        variant="ghost"
        :disabled="busy"
        @click="unblockAll"
      >
        {{
          $t("providers.party.guest_page.host_unblock", [
            status.blocked_guests.length,
          ])
        }}
      </Button>
    </div>

    <PartyHostConfirm
      v-model:open="confirmClear"
      :title="$t('providers.party.guest_page.host_clear_queue')"
      :description="$t('providers.party.guest_page.host_clear_queue_confirm')"
      @confirm="clearUpcoming()"
    />
  </div>
</template>

<script setup lang="ts">
import PartyHostConfirm from "@/components/party/PartyHostConfirm.vue";
import PartyHostPlayback from "@/components/party/PartyHostPlayback.vue";
import PartyHostVolume from "@/components/party/PartyHostVolume.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePartyHost } from "@/composables/party/usePartyHost";
import type { PlayerQueue } from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import { ref } from "vue";

const MESSAGE_MAX_LENGTH = 140;

defineProps<{ queue: PlayerQueue | null | undefined }>();

const {
  status,
  busy,
  postMessage,
  resetTokens,
  clearUpcoming,
  unblockGuest,
  unblockAll,
} = usePartyHost();

const message = ref("");
const confirmClear = ref(false);

const sendMessage = async () => {
  await postMessage(message.value);
  message.value = "";
};
</script>
