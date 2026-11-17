import {
  followersCannotFollow,
  getAudioGroupMemberIds,
  getFollowedPlayerId,
  getFollowerIds,
  getLightGroupMemberIds,
  isPlayerGrouped,
} from "@/helpers/player_grouping";
import {
  PlaybackState,
  type Player,
  PlayerType,
} from "@/plugins/api/interfaces";
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

describe("followers", () => {
  const follower = {
    ...player("light", PlayerType.LIGHT),
    extra_attributes: { follows: "speaker" },
  } as Player;
  const member = player("strip", PlayerType.LIGHT);

  function leader(queueItemId: string | null): Player {
    return {
      ...player("speaker", PlayerType.PLAYER, ["speaker", "light", "strip"]),
      playback_state: PlaybackState.PLAYING,
      current_media: { queue_item_id: queueItemId },
    } as unknown as Player;
  }

  it("reads the player a light follows", () => {
    expect(getFollowedPlayerId(follower)).toBe("speaker");
    expect(getFollowedPlayerId(member)).toBeUndefined();
    expect(getFollowedPlayerId(undefined)).toBeUndefined();
  });

  it("tells followers from protocol members", () => {
    const players = { light: follower, strip: member };
    expect(getFollowerIds(leader("item"), players)).toEqual(["light"]);
  });

  it("flags a live source its followers cannot follow", () => {
    const players = { light: follower, strip: member };
    expect(followersCannotFollow(leader(null), players)).toBe(true);
    expect(followersCannotFollow(leader("item"), players)).toBe(false);
    expect(followersCannotFollow(leader(null), { strip: member })).toBe(false);
  });
});
