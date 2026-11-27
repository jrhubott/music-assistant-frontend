import PartyQueueItem from "@/components/party/PartyQueueItem.vue";
import { usePartyHost } from "@/composables/party/usePartyHost";
import api from "@/plugins/api";
import type { QueueItem } from "@/plugins/api/interfaces";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/plugins/api", () => ({ default: { sendCommand: vi.fn() } }));
vi.mock("@/plugins/i18n", () => ({ $t: (key: string) => key }));
vi.mock("vue-sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const REMOVE = "providers.party.guest_page.host_remove";
const MUTE = "providers.party.guest_page.host_mute";
const BLOCK = "providers.party.guest_page.host_block";

const mountItem = (index: number) =>
  mount(PartyQueueItem, {
    global: { mocks: { $t: (key: string) => key } },
    props: {
      item: {
        queue_item_id: "song",
        name: "Song",
        extra_attributes: {
          party_guest: true,
          party_guest_id: "guest",
          party_message: "hello",
        },
      } as unknown as QueueItem,
      index,
      queueFetchOffset: 0,
      currentQueueIndex: 1,
      isPlaying: true,
      boostBadgeColor: "#B55522",
      requestBadgeColor: "#2D6A4F",
      boostEnabled: false,
      rateLimitingEnabled: false,
      boostTokens: 0,
      boosting: false,
      isExpanded: true,
    },
  });

const setHost = (isHost: boolean) => {
  usePartyHost().status.value = {
    enabled: true,
    is_host: isHost,
    retry_after: 0,
    blocked_count: 0,
  };
};

describe("party host tools on a queue item", () => {
  beforeEach(() => vi.mocked(api.sendCommand).mockReset());

  it("shows no host tools to a guest", () => {
    setHost(false);
    const text = mountItem(2).text();
    expect(text).not.toContain(REMOVE);
    expect(text).not.toContain(BLOCK);
  });

  it("offers remove, mute and block on an upcoming song", () => {
    setHost(true);
    const text = mountItem(2).text();
    expect(text).toContain(REMOVE);
    expect(text).toContain(MUTE);
    expect(text).toContain(BLOCK);
  });

  it("cannot remove the song that is playing", () => {
    setHost(true);
    const text = mountItem(1).text();
    expect(text).not.toContain(REMOVE);
    expect(text).toContain(MUTE);
  });

  it("sends the remove command for the song", async () => {
    setHost(true);
    vi.mocked(api.sendCommand).mockResolvedValue({ is_host: true });
    const button = mountItem(2)
      .findAll("button")
      .find((candidate) => candidate.text().includes(REMOVE));
    await button?.trigger("click");
    expect(api.sendCommand).toHaveBeenCalledWith("party/host_remove_item", {
      queue_item_id: "song",
    });
  });
});
