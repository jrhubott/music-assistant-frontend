import type { PartyConfig } from "@/plugins/api/interfaces";
import { describe, expect, it } from "vitest";
import { partyTips } from "./party_tips";

const config = (overrides: Partial<PartyConfig> = {}): PartyConfig =>
  ({
    show_tips: true,
    enable_add_queue: true,
    enable_guest_names: true,
    enable_boost: true,
    enable_shout_outs: true,
    enable_skip_song: true,
    enable_reactions: true,
    ...overrides,
  }) as PartyConfig;

describe("partyTips", () => {
  it("has a tip for every feature guests can use", () => {
    expect(partyTips(config(), true)).toEqual([
      "scan",
      "nickname",
      "boost",
      "shout_out",
      "skip",
      "react",
    ]);
  });

  it("leaves out features that are off", () => {
    expect(
      partyTips(
        config({
          enable_boost: false,
          enable_skip_song: false,
          enable_reactions: false,
          enable_guest_names: false,
        }),
        true,
      ),
    ).toEqual(["scan", "shout_out"]);
  });

  it("has no shout-out tip when guests cannot add songs", () => {
    expect(partyTips(config({ enable_add_queue: false }), true)).not.toContain(
      "shout_out",
    );
  });

  it("leaves out the scan tip while the queue is empty", () => {
    expect(partyTips(config(), true, true)).not.toContain("scan");
    expect(partyTips(config(), true, true)).toContain("boost");
  });

  it("shows nothing when tips are off or guests cannot join", () => {
    expect(partyTips(config({ show_tips: false }), true)).toEqual([]);
    expect(partyTips(config(), false)).toEqual([]);
    expect(partyTips(null, true)).toEqual([]);
  });
});
