/**
 * Live party events for the party screen: guest reactions, new requests and
 * the leaderboard. The party provider sends them as PROVIDER_EVENT events.
 */

import api from "@/plugins/api";
import {
  type EventMessage,
  EventType,
  type PartyLeaderboardEntry,
  type PartyProviderEvent,
} from "@/plugins/api/interfaces";
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";

export interface PartyScreenEventHandlers {
  onReaction?: (emoji: string) => void;
  onGuestRequest?: (
    request: Extract<PartyProviderEvent, { event: "guest_request" }>,
  ) => void;
}

export function usePartyScreenEvents(
  partyInstanceId: Ref<string | undefined>,
  handlers: PartyScreenEventHandlers,
) {
  const leaderboard = ref<PartyLeaderboardEntry[]>([]);
  let unmounted = false;

  const fetchLeaderboard = async () => {
    try {
      const entries =
        await api.sendCommand<PartyLeaderboardEntry[]>("party/leaderboard");
      if (!unmounted) leaderboard.value = entries ?? [];
    } catch (error) {
      // the party screen runs unattended, so a missing leaderboard just stays hidden
      console.debug("Failed to fetch party leaderboard:", error);
    }
  };

  const handleEvent = (evt: EventMessage) => {
    if (!partyInstanceId.value || evt.object_id !== partyInstanceId.value) {
      return;
    }
    const data = evt.data as PartyProviderEvent | undefined;
    switch (data?.event) {
      case "reaction":
        handlers.onReaction?.(data.emoji);
        break;
      case "guest_request":
        handlers.onGuestRequest?.(data);
        break;
      case "leaderboard_updated":
        leaderboard.value = data.leaderboard;
        break;
    }
  };

  const unsubscribers: Array<() => void> = [];

  onMounted(() => {
    unsubscribers.push(
      api.subscribe(EventType.PROVIDER_EVENT, handleEvent),
      // a provider reload starts a new party, with an empty leaderboard
      api.subscribe(EventType.PROVIDERS_UPDATED, () => {
        if (partyInstanceId.value) fetchLeaderboard();
      }),
    );
    if (partyInstanceId.value) fetchLeaderboard();
  });

  watch(partyInstanceId, (id) => {
    if (id) fetchLeaderboard();
  });

  onBeforeUnmount(() => {
    unmounted = true;
    unsubscribers.forEach((unsub) => unsub());
  });

  return { leaderboard };
}
