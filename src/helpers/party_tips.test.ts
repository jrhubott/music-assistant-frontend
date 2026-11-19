import type { PartyConfig } from "@/plugins/api/interfaces";
import { describe, expect, it } from "vitest";
import { partyTickerSlides, partyTips } from "./party_tips";

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

  it("shows nothing when tips are off or guests cannot join", () => {
    expect(partyTips(config({ show_tips: false }), true)).toEqual([]);
    expect(partyTips(config(), false)).toEqual([]);
    expect(partyTips(null, true)).toEqual([]);
  });
});

describe("partyTickerSlides", () => {
  it("brings the leaderboard back between tips", () => {
    expect(partyTickerSlides(["scan", "boost", "skip"], true, 2)).toEqual([
      { kind: "leaderboard" },
      { kind: "tip", tip: "scan" },
      { kind: "tip", tip: "boost" },
      { kind: "leaderboard" },
      { kind: "tip", tip: "skip" },
    ]);
  });

  it("shows only tips without a leaderboard", () => {
    expect(partyTickerSlides(["scan"], false, 2)).toEqual([
      { kind: "tip", tip: "scan" },
    ]);
  });

  it("shows only the leaderboard without tips", () => {
    expect(partyTickerSlides([], true, 2)).toEqual([{ kind: "leaderboard" }]);
    expect(partyTickerSlides([], false, 2)).toEqual([]);
  });
});
