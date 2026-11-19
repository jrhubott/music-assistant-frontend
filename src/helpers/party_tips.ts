import type { PartyConfig } from "@/plugins/api/interfaces";

// Translation keys (under providers.party.tips) of the tips that apply to what
// guests can do at this party, in the order they rotate.
export type PartyTip =
  "scan" | "nickname" | "boost" | "shout_out" | "skip" | "react";

/**
 * Return the tips to rotate on the party screen for the given party config.
 * Only features guests can use get a tip, and none when guests cannot join.
 */
export function partyTips(
  config: PartyConfig | null,
  guestAccess: boolean,
): PartyTip[] {
  if (!config?.show_tips || !guestAccess) return [];
  const tips: PartyTip[] = [];
  if (config.enable_add_queue) tips.push("scan");
  if (config.enable_guest_names) tips.push("nickname");
  if (config.enable_boost) tips.push("boost");
  if (config.enable_add_queue && config.enable_shout_outs) {
    tips.push("shout_out");
  }
  if (config.enable_skip_song) tips.push("skip");
  if (config.enable_reactions) tips.push("react");
  return tips;
}

export type PartyTickerSlide =
  { kind: "tip"; tip: PartyTip } | { kind: "leaderboard" };

/**
 * Return the slides the party screen ticker rotates through: the tips, with the
 * leaderboard coming back after every `tipsBetweenLeaderboards` tips.
 */
export function partyTickerSlides(
  tips: PartyTip[],
  hasLeaderboard: boolean,
  tipsBetweenLeaderboards: number,
): PartyTickerSlide[] {
  const slides: PartyTickerSlide[] = [];
  tips.forEach((tip, index) => {
    if (hasLeaderboard && index % tipsBetweenLeaderboards === 0) {
      slides.push({ kind: "leaderboard" });
    }
    slides.push({ kind: "tip", tip });
  });
  if (hasLeaderboard && !slides.length) slides.push({ kind: "leaderboard" });
  return slides;
}
