import api from "@/plugins/api";
import {
  PlaybackState,
  type Player,
  PlayerType,
} from "@/plugins/api/interfaces";

type PlayerLookup = Record<string, Player | undefined>;

/**
 * Check if a group member is a light.
 *
 * A light follows the audio of its group but renders none itself, so it never
 * counts as a speaker of the group.
 */
export const isLightMember = function (
  playerId: string,
  players: PlayerLookup = api.players,
): boolean {
  return players[playerId]?.type === PlayerType.LIGHT;
};

/**
 * Return the ids of the group members that render audio, the player itself left out.
 */
export const getAudioGroupMemberIds = function (
  player: Player,
  players: PlayerLookup = api.players,
): string[] {
  return [...new Set(player.group_members)].filter(
    (playerId) =>
      playerId !== player.player_id && !isLightMember(playerId, players),
  );
};

/**
 * Return the ids of the lights grouped with the player.
 */
export const getLightGroupMemberIds = function (
  player: Player,
  players: PlayerLookup = api.players,
): string[] {
  return [...new Set(player.group_members)].filter(
    (playerId) =>
      playerId !== player.player_id && isLightMember(playerId, players),
  );
};

/**
 * Check if the player plays together with other speakers.
 *
 * Lights in its group do not count: a speaker with only lights grouped still
 * plays (and is controlled) on its own.
 */
export const isPlayerGrouped = function (
  player: Player,
  players: PlayerLookup = api.players,
): boolean {
  return getAudioGroupMemberIds(player, players).length > 0;
};

const ATTR_FOLLOWS = "follows";

/**
 * Return the id of the player a light follows, if it follows one.
 *
 * A follower takes what its leader plays from the leader's own audio instead of
 * joining a protocol group with it.
 */
export const getFollowedPlayerId = function (
  player: Player | undefined,
): string | undefined {
  const value = player?.extra_attributes?.[ATTR_FOLLOWS];
  return typeof value === "string" && value ? value : undefined;
};

/**
 * Return the ids of the lights that follow the player.
 */
export const getFollowerIds = function (
  player: Player,
  players: PlayerLookup = api.players,
): string[] {
  return [...new Set(player.group_members)].filter(
    (playerId) => getFollowedPlayerId(players[playerId]) === player.player_id,
  );
};

/**
 * Check if the player has followers but plays something they cannot follow.
 *
 * Followers read the audio of the queue item the player plays; a live source
 * (Spotify Connect, an AirPlay receiver, a line-in) has none, so they stay dark.
 */
export const followersCannotFollow = function (
  player: Player,
  players: PlayerLookup = api.players,
): boolean {
  return (
    player.playback_state === PlaybackState.PLAYING &&
    !player.current_media?.queue_item_id &&
    getFollowerIds(player, players).length > 0
  );
};
