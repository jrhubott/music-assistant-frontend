import api from "@/plugins/api";
import { type Player, PlayerType } from "@/plugins/api/interfaces";

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
