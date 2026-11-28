import type { PartyConfig } from "@/plugins/api/interfaces";
import { describe, expect, it } from "vitest";
import { partyTips, partyTipValues } from "./party_tips";

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

  it("adds a karaoke tip in karaoke mode", () => {
    expect(partyTips(config(), true)).not.toContain("karaoke");
    expect(partyTips(config({ karaoke_mode: true }), true)).toContain(
      "karaoke",
    );
  });

  it("adds a silent disco tip only in remote mode", () => {
    expect(partyTips(config({ mode: "venue" }), true)).not.toContain(
      "silent_disco",
    );
    expect(partyTips(config({ mode: "remote" }), true)).toContain(
      "silent_disco",
    );
  });

  it("adds a skip votes tip only when it takes more than one vote", () => {
    expect(partyTips(config({ skip_votes_required: 1 }), true)).not.toContain(
      "skip_votes",
    );
    const party = config({ skip_votes_required: 3 });
    expect(partyTips(party, true)).toContain("skip_votes");
    expect(partyTipValues("skip_votes", party)).toEqual([3]);
  });

  it("adds a refill tip only when requests are limited", () => {
    const limited = {
      enable_rate_limiting: true,
      add_queue_limit: 5,
      add_queue_refill_minutes: 10,
    };
    expect(partyTips(config(limited), true)).toContain("request_refill");
    expect(partyTipValues("request_refill", config(limited))).toEqual([10]);
    expect(
      partyTips(config({ ...limited, enable_rate_limiting: false }), true),
    ).not.toContain("request_refill");
    expect(
      partyTips(config({ ...limited, enable_add_queue: false }), true),
    ).not.toContain("request_refill");
  });

  it("shows nothing when tips are off or guests cannot join", () => {
    expect(partyTips(config({ show_tips: false }), true)).toEqual([]);
    expect(partyTips(config(), false)).toEqual([]);
    expect(partyTips(null, true)).toEqual([]);
  });
});
