<template>
  <div class="queue-item-actions flex-wrap" @click.stop>
    <p v-if="shoutOut" class="w-full text-sm opacity-80">“{{ shoutOut }}”</p>
    <Button size="sm" variant="outline" :disabled="busy" @click="playItem(id)">
      <Play :size="16" />
      {{ $t("providers.party.guest_page.host_play_now") }}
    </Button>
    <template v-if="isUpcoming">
      <Button
        size="sm"
        variant="outline"
        :disabled="busy"
        @click="playNext(id)"
      >
        <ListStart :size="16" />
        {{ $t("providers.party.guest_page.host_play_next") }}
      </Button>
      <Button
        size="icon-sm"
        variant="outline"
        :disabled="busy || !canMoveUp"
        :aria-label="$t('providers.party.guest_page.host_move_up')"
        @click="moveItem(id, -1)"
      >
        <ArrowUp :size="16" />
      </Button>
      <Button
        size="icon-sm"
        variant="outline"
        :disabled="busy"
        :aria-label="$t('providers.party.guest_page.host_move_down')"
        @click="moveItem(id, 1)"
      >
        <ArrowDown :size="16" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        :disabled="busy"
        @click="removeItem(id)"
      >
        <Trash2 :size="16" />
        {{ $t("providers.party.guest_page.host_remove") }}
      </Button>
    </template>
    <Button
      v-if="shoutOut"
      size="sm"
      variant="outline"
      :disabled="busy"
      @click="muteShoutOut(id)"
    >
      <MessageSquareOff :size="16" />
      {{ $t("providers.party.guest_page.host_mute") }}
    </Button>
    <template v-if="guestId">
      <Button
        size="sm"
        variant="outline"
        :disabled="busy"
        @click="grantTokens(guestId)"
      >
        <Coins :size="16" />
        {{ $t("providers.party.guest_page.host_add_tokens") }}
      </Button>
      <Button
        v-if="config?.enable_guest_names"
        size="sm"
        variant="outline"
        :disabled="busy"
        @click="renaming = !renaming"
      >
        <Pencil :size="16" />
        {{ $t("providers.party.guest_page.host_rename") }}
      </Button>
      <Button
        size="sm"
        variant="outline"
        :disabled="busy"
        @click="confirmClear = true"
      >
        <ListX :size="16" />
        {{ $t("providers.party.guest_page.host_clear_guest") }}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        :disabled="busy"
        @click="blockGuest(id)"
      >
        <Ban :size="16" />
        {{ $t("providers.party.guest_page.host_block") }}
      </Button>
      <form v-if="renaming" class="flex w-full gap-2" @submit.prevent="rename">
        <Input
          v-model="newName"
          class="flex-1"
          maxlength="24"
          :placeholder="
            $t('providers.party.guest_page.host_rename_placeholder')
          "
          :aria-label="$t('providers.party.guest_page.host_rename_placeholder')"
        />
        <Button type="submit" size="sm" :disabled="busy || !newName.trim()">
          {{ $t("providers.party.guest_page.host_rename") }}
        </Button>
      </form>
      <PartyHostConfirm
        v-model:open="confirmClear"
        :title="$t('providers.party.guest_page.host_clear_guest')"
        :description="$t('providers.party.guest_page.host_clear_guest_confirm')"
        @confirm="clearUpcoming(guestId)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import PartyHostConfirm from "@/components/party/PartyHostConfirm.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePartyHost } from "@/composables/party/usePartyHost";
import { usePartyConfig } from "@/composables/usePartyConfig";
import type { QueueItem } from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Coins,
  ListStart,
  ListX,
  MessageSquareOff,
  Pencil,
  Play,
  Trash2,
} from "@lucide/vue";
import { computed, ref } from "vue";

const props = defineProps<{
  item: QueueItem;
  isUpcoming: boolean;
  canMoveUp: boolean;
}>();

const { config } = usePartyConfig();
const {
  busy,
  playItem,
  playNext,
  moveItem,
  removeItem,
  muteShoutOut,
  blockGuest,
  grantTokens,
  renameGuest,
  clearUpcoming,
} = usePartyHost();

const id = computed(() => props.item.queue_item_id);
const shoutOut = computed(() => props.item.extra_attributes?.party_message);
const guestId = computed(
  () => props.item.extra_attributes?.party_guest_id as string | undefined,
);

const renaming = ref(false);
const newName = ref("");
const confirmClear = ref(false);

const rename = async () => {
  if (!guestId.value) return;
  await renameGuest(guestId.value, newName.value);
  newName.value = "";
  renaming.value = false;
};
</script>
