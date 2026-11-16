import {
  getAudioGroupMemberIds,
  getLightGroupMemberIds,
  isPlayerGrouped,
} from "@/helpers/player_grouping";
import { type Player, PlayerType } from "@/plugins/api/interfaces";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/plugins/api", () => {
  const api = { players: {} };
  return { api, default: api };
});

function player(
  player_id: string,
  type: PlayerType = PlayerType.PLAYER,
  group_members: string[] = [],
): Player {
  return { player_id, type, group_members } as unknown as Player;
}

const speaker = player("speaker", PlayerType.PLAYER, ["speaker", "light"]);
const light = player("light", PlayerType.LIGHT);
const kitchen = player("kitchen");

describe("player grouping", () => {
  it("does not count a light as a speaker of the group", () => {
    const players = { speaker, light };

    expect(getAudioGroupMemberIds(speaker, players)).toEqual([]);
    expect(getLightGroupMemberIds(speaker, players)).toEqual(["light"]);
    expect(isPlayerGrouped(speaker, players)).toBe(false);
  });

  it("counts the speakers next to a light", () => {
    const leader = player("speaker", PlayerType.PLAYER, [
      "speaker",
      "kitchen",
      "light",
    ]);
    const players = { speaker: leader, kitchen, light };

    expect(getAudioGroupMemberIds(leader, players)).toEqual(["kitchen"]);
    expect(isPlayerGrouped(leader, players)).toBe(true);
  });

  it("treats a group player with members as grouped", () => {
    const group = player("group", PlayerType.GROUP, ["kitchen"]);

    expect(isPlayerGrouped(group, { group, kitchen })).toBe(true);
    expect(isPlayerGrouped(player("empty", PlayerType.GROUP), {})).toBe(false);
  });
});
