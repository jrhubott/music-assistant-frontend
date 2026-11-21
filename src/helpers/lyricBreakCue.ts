/**
 * The "get ready" countdown for the first lyric line after a musical break.
 *
 * Singers lose their place during an instrumental, so the line that ends a
 * break counts down its last few seconds before it is sung.
 */

export interface CueableLine {
  time: number;
  isBreak: boolean;
}

export interface BreakCue {
  /** Index of the line that is about to be sung. */
  index: number;
  /** Whole seconds left before it, rounded up: 3, 2, 1. */
  secondsLeft: number;
}

/** Seconds before a line after a break that the countdown starts. */
export const CUE_SECONDS = 3;

/**
 * Return the countdown to show at a playback position, or null when none.
 *
 * @param lines The displayed lines, breaks included, in time order.
 * @param position Playback position in seconds.
 */
export const findBreakCue = (
  lines: CueableLine[],
  position: number,
): BreakCue | null => {
  for (let index = 1; index < lines.length; index++) {
    const line = lines[index];
    if (line.isBreak || !lines[index - 1].isBreak) continue;
    const left = line.time - position;
    if (left > 0 && left <= CUE_SECONDS) {
      return { index, secondsLeft: Math.ceil(left) };
    }
  }
  return null;
};
