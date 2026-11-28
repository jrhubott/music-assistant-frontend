/**
 * Collects token resets and extra tokens from the party host. Tokens live in
 * the guest's browser, so the server hands them over when told they changed.
 */

import type {
  PartyGuestTokens,
  useRateLimiting,
} from "@/composables/useRateLimiting";
import api from "@/plugins/api";
import {
  type EventMessage,
  EventType,
  type PartyProviderEvent,
} from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import { toast } from "vue-sonner";

export function usePartyGuestTokens(
  rateLimit: Pick<ReturnType<typeof useRateLimiting>, "applyHostTokens">,
) {
  const collect = async () => {
    try {
      const update = await api.sendCommand<PartyGuestTokens | null>(
        "party/guest_tokens",
      );
      if (!update) return;
      rateLimit.applyHostTokens(update);
      if (update.granted > 0) {
        toast.success($t("providers.party.guest_page.host_tokens_received"));
      }
    } catch (error) {
      // the guest keeps the tokens they have and collects on the next event
      console.debug("Failed to collect party tokens:", error);
    }
  };

  return (): (() => void) => {
    const unsubscribe = api.subscribe(
      EventType.PROVIDER_EVENT,
      (evt: EventMessage) => {
        const data = evt.data as PartyProviderEvent | undefined;
        if (data?.event === "tokens_updated") collect();
      },
    );
    collect();
    return unsubscribe;
  };
}
