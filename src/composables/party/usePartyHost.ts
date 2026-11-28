/**
 * Host mode on the party guest page. The server decides who is a host, per
 * device, so this state only controls which tools are shown.
 */

import api from "@/plugins/api";
import { $t } from "@/plugins/i18n";
import { computed, ref } from "vue";
import { toast } from "vue-sonner";

interface PartyHostStatus {
  enabled: boolean;
  is_host: boolean;
  retry_after: number;
  blocked_count: number;
}

const HOST_OFF: PartyHostStatus = {
  enabled: false,
  is_host: false,
  retry_after: 0,
  blocked_count: 0,
};

const status = ref<PartyHostStatus>(HOST_OFF);
const busy = ref(false);

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
  successKey: string,
): Promise<void> => {
  busy.value = true;
  try {
    await api.sendCommand(command, args);
    toast.success($t(successKey));
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
  };
}
