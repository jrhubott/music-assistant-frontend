/**
 * Host mode on the party guest page. The server decides who is a host, per
 * device, so this state only controls which tools are shown.
 */

import api from "@/plugins/api";
import type { RepeatMode } from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import { computed, ref } from "vue";
import { toast } from "vue-sonner";

interface PartyHostStatus {
  enabled: boolean;
  is_host: boolean;
  retry_after: number;
  blocked_count: number;
  blocked_guests: PartyBlockedGuest[];
}

export interface PartyBlockedGuest {
  guest_id: string;
  name: string | null;
}

export interface PartyHostSpeaker {
  player_id: string;
  name: string;
  volume: number;
  muted: boolean;
}

export interface PartyHostVolumeState {
  max_volume: number;
  group_volume: number;
  group_muted: boolean;
  speakers: PartyHostSpeaker[];
}

export type PartyHostAddResult = "added" | "no_lyrics" | "failed";

const REASON_NO_LYRICS = "no_lyrics";

const HOST_OFF: PartyHostStatus = {
  enabled: false,
  is_host: false,
  retry_after: 0,
  blocked_count: 0,
  blocked_guests: [],
};

const status = ref<PartyHostStatus>(HOST_OFF);
const busy = ref(false);
const volume = ref<PartyHostVolumeState | null>(null);

const refresh = async () => {
  try {
    status.value =
      (await api.sendCommand<PartyHostStatus | null>("party/host_status")) ??
      HOST_OFF;
  } catch (error) {
    console.debug("Failed to fetch party host status:", error);
    status.value = HOST_OFF;
  }
};

const unlock = async (pin: string): Promise<boolean> => {
  busy.value = true;
  try {
    const result = await api.sendCommand<{
      success: boolean;
      retry_after: number;
    }>("party/host_unlock", { pin });
    await refresh();
    if (result.success) {
      toast.success($t("providers.party.guest_page.host_unlocked"));
    } else if (result.retry_after > 0) {
      toast.error(
        $t("providers.party.guest_page.host_locked_out", [
          Math.ceil(result.retry_after / 60),
        ]),
      );
    } else {
      toast.error($t("providers.party.guest_page.host_wrong_pin"));
    }
    return result.success;
  } catch (error) {
    console.error("Failed to unlock host mode:", error);
    toast.error($t("providers.party.guest_page.host_action_failed"));
    return false;
  } finally {
    busy.value = false;
  }
};

const runAction = async (
  command: string,
  args: Record<string, unknown>,
  // left out for controls that show the result themselves, like a slider
  successKey?: string,
): Promise<void> => {
  busy.value = true;
  try {
    await api.sendCommand(command, args);
    if (successKey) toast.success($t(successKey));
  } catch (error) {
    console.error(`Party host action ${command} failed:`, error);
    toast.error($t("providers.party.guest_page.host_action_failed"));
  } finally {
    await refresh();
    busy.value = false;
  }
};

const lock = async () => {
  await runAction(
    "party/host_lock",
    {},
    "providers.party.guest_page.host_left",
  );
};

const removeItem = (queueItemId: string) =>
  runAction(
    "party/host_remove_item",
    { queue_item_id: queueItemId },
    "providers.party.guest_page.host_removed",
  );

const muteShoutOut = (queueItemId: string) =>
  runAction(
    "party/host_mute_shout_out",
    { queue_item_id: queueItemId },
    "providers.party.guest_page.host_muted",
  );

const blockGuest = (queueItemId: string) =>
  runAction(
    "party/host_block_guest",
    { queue_item_id: queueItemId },
    "providers.party.guest_page.host_blocked",
  );

const unblockAll = () =>
  runAction(
    "party/host_unblock_all",
    {},
    "providers.party.guest_page.host_unblocked",
  );

const unblockGuest = (guestId: string) =>
  runAction(
    "party/host_unblock_guest",
    { guest_id: guestId },
    "providers.party.guest_page.host_unblocked_one",
  );

const renameGuest = (guestId: string, name: string) =>
  runAction(
    "party/host_rename_guest",
    { guest_id: guestId, name },
    "providers.party.guest_page.host_renamed",
  );

const grantTokens = (guestId: string) =>
  runAction(
    "party/host_grant_tokens",
    { guest_id: guestId, amount: 1 },
    "providers.party.guest_page.host_tokens_given",
  );

const resetTokens = () =>
  runAction(
    "party/host_reset_tokens",
    {},
    "providers.party.guest_page.host_tokens_reset",
  );

const moveItem = (queueItemId: string, posShift: number) =>
  runAction("party/host_move_item", {
    queue_item_id: queueItemId,
    pos_shift: posShift,
  });

const playNext = (queueItemId: string) =>
  runAction(
    "party/host_play_next",
    { queue_item_id: queueItemId },
    "providers.party.guest_page.host_moved_next",
  );

const playItem = (queueItemId: string) =>
  runAction("party/host_play_item", { queue_item_id: queueItemId });

const clearUpcoming = (guestId?: string) =>
  runAction(
    "party/host_clear_upcoming",
    guestId ? { guest_id: guestId } : {},
    "providers.party.guest_page.host_cleared",
  );

const playPause = () => runAction("party/host_play_pause", {});
const next = () => runAction("party/host_next", {});
const previous = () => runAction("party/host_previous", {});
const seek = (position: number) => runAction("party/host_seek", { position });
const setShuffle = (enabled: boolean) =>
  runAction("party/host_set_shuffle", { enabled });
const setRepeat = (repeatMode: RepeatMode) =>
  runAction("party/host_set_repeat", { repeat_mode: repeatMode });

const postMessage = (message: string) =>
  runAction(
    "party/host_post_message",
    { message },
    "providers.party.guest_page.host_message_sent",
  );

const refreshVolume = async () => {
  try {
    volume.value = await api.sendCommand<PartyHostVolumeState>(
      "party/host_volume_state",
    );
  } catch (error) {
    console.error("Failed to fetch party volume:", error);
    toast.error($t("providers.party.guest_page.host_action_failed"));
  }
};

const runVolumeAction = async (
  command: string,
  args: Record<string, unknown>,
) => {
  await runAction(command, args);
  await refreshVolume();
};

const setGroupVolume = (level: number) =>
  runVolumeAction("party/host_set_group_volume", { volume_level: level });
const setGroupMute = (muted: boolean) =>
  runVolumeAction("party/host_set_group_mute", { muted });
const setSpeakerVolume = (playerId: string, level: number) =>
  runVolumeAction("party/host_set_speaker_volume", {
    player_id: playerId,
    volume_level: level,
  });
const setSpeakerMute = (playerId: string, muted: boolean) =>
  runVolumeAction("party/host_set_speaker_mute", {
    player_id: playerId,
    muted,
  });

const addToQueue = async (
  uri: string,
  playNextUp: boolean,
): Promise<PartyHostAddResult> => {
  try {
    const result = await api.sendCommand<{
      success: boolean;
      reason?: string;
    }>("party/host_add_to_queue", { uri, play_next: playNextUp });
    if (result.reason === REASON_NO_LYRICS) return "no_lyrics";
    return result.success ? "added" : "failed";
  } catch (error) {
    console.error("Party host failed to add a song:", error);
    return "failed";
  }
};

export function usePartyHost() {
  return {
    status,
    busy,
    isHost: computed(() => status.value.is_host),
    refresh,
    unlock,
    lock,
    removeItem,
    muteShoutOut,
    blockGuest,
    unblockAll,
    unblockGuest,
    renameGuest,
    grantTokens,
    resetTokens,
    moveItem,
    playNext,
    playItem,
    clearUpcoming,
    playPause,
    next,
    previous,
    seek,
    setShuffle,
    setRepeat,
    postMessage,
    volume,
    refreshVolume,
    setGroupVolume,
    setGroupMute,
    setSpeakerVolume,
    setSpeakerMute,
    addToQueue,
  };
}
