import { describe, expect, it } from "vitest";
import { CUE_SECONDS, findBreakCue } from "./lyricBreakCue";

const lines = [
  { time: 5, isBreak: true }, // intro break
  { time: 10, isBreak: false },
  { time: 14, isBreak: false },
  { time: 18, isBreak: true }, // instrumental
  { time: 30, isBreak: false },
];

describe("findBreakCue", () => {
  it("counts down the line after the intro break", () => {
    expect(findBreakCue(lines, 7.5)).toEqual({ index: 1, secondsLeft: 3 });
    expect(findBreakCue(lines, 8.2)).toEqual({ index: 1, secondsLeft: 2 });
    expect(findBreakCue(lines, 9.9)).toEqual({ index: 1, secondsLeft: 1 });
  });

  it("counts down the line after an instrumental break", () => {
    expect(findBreakCue(lines, 30 - CUE_SECONDS)).toEqual({
      index: 4,
      secondsLeft: 3,
    });
  });

  it("is quiet outside the countdown and once the line is sung", () => {
    expect(findBreakCue(lines, 6)).toBeNull();
    expect(findBreakCue(lines, 10)).toBeNull();
    expect(findBreakCue(lines, 25)).toBeNull();
  });

  it("does not count down a line that follows another line", () => {
    expect(findBreakCue(lines, 12)).toBeNull();
  });
});
