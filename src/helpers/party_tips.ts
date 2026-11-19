import type { PartyConfig } from "@/plugins/api/interfaces";

// Translation keys (under providers.party.tips) of the tips that apply to what
// guests can do at this party, in the order they rotate.
export type PartyTip =
  "scan" | "nickname" | "boost" | "shout_out" | "skip" | "react";

/**
 * Return the tips to rotate on the party screen for the given party config.
 * Only features guests can use get a tip, and none when guests cannot join.
 * The scan tip is left out while the queue is empty, because the empty screen
 * already invites guests to scan the code.
 */
export function partyTips(
  config: PartyConfig | null,
  guestAccess: boolean,
  queueEmpty = false,
): PartyTip[] {
  if (!config?.show_tips || !guestAccess) return [];
  const tips: PartyTip[] = [];
  if (config.enable_add_queue && !queueEmpty) tips.push("scan");
  if (config.enable_guest_names) tips.push("nickname");
  if (config.enable_boost) tips.push("boost");
  if (config.enable_add_queue && config.enable_shout_outs) {
    tips.push("shout_out");
  }
  if (config.enable_skip_song) tips.push("skip");
  if (config.enable_reactions) tips.push("react");
  return tips;
}
