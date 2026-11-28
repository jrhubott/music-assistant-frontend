<template>
  <div v-if="volume?.speakers.length" class="flex flex-col gap-3">
    <PartyHostVolumeRow
      :label="$t('providers.party.guest_page.host_group_volume')"
      :level="volume.group_volume"
      :muted="volume.group_muted"
      :max="volume.max_volume"
      @set-level="setGroupVolume"
      @set-muted="setGroupMute"
    />
    <PartyHostVolumeRow
      v-for="speaker in showSpeakers ? volume.speakers : []"
      :key="speaker.player_id"
      :label="speaker.name"
      :level="speaker.volume"
      :muted="speaker.muted"
      :max="volume.max_volume"
      @set-level="setSpeakerVolume(speaker.player_id, $event)"
      @set-muted="setSpeakerMute(speaker.player_id, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import PartyHostVolumeRow from "@/components/party/PartyHostVolumeRow.vue";
import { usePartyHost } from "@/composables/party/usePartyHost";
import api from "@/plugins/api";
import { type EventMessage, EventType } from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import { computed, onBeforeUnmount, onMounted } from "vue";

const {
  volume,
  refreshVolume,
  setGroupVolume,
  setGroupMute,
  setSpeakerVolume,
  setSpeakerMute,
} = usePartyHost();

const showSpeakers = computed(() => (volume.value?.speakers.length ?? 0) > 1);

let unsubscribe: (() => void) | undefined;

onMounted(() => {
  refreshVolume();
  unsubscribe = api.subscribe(EventType.PLAYER_UPDATED, (evt: EventMessage) => {
    if (volume.value?.speakers.some((s) => s.player_id === evt.object_id)) {
      refreshVolume();
    }
  });
});

onBeforeUnmount(() => unsubscribe?.());
</script>
