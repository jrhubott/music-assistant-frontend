import { describe, expect, it } from "vitest";
import {
  DEFAULT_SECONDS_PER_CHAR,
  MAX_SECONDS_PER_CHAR,
  stripWordStamps,
  timeLyricWords,
  wordFillPercent,
} from "./lyricWordTiming";

describe("timeLyricWords (estimated)", () => {
  it("spreads the line over its words by length", () => {
    const { text, words } = timeLyricWords("I love you", 10, 12);
    expect(text).toBe("I love you");
    expect(words.map((w) => w.text)).toEqual(["I ", "love ", "you"]);
    // 8 letters over 2 seconds: I=1, love=4, you=3
    expect(words[0].start).toBe(10);
    expect(words[0].end).toBeCloseTo(10.25);
    expect(words[1].end).toBeCloseTo(11.25);
    expect(words[2].end).toBeCloseTo(12);
  });

  it("ends early when the gap to the next line is long", () => {
    const { words } = timeLyricWords("hey", 0, 30);
    expect(words[0].end).toBeCloseTo(3 * MAX_SECONDS_PER_CHAR);
  });

  it("uses a default pace for the last line", () => {
    const { words } = timeLyricWords("hello", 5);
    expect(words[0].end).toBeCloseTo(5 + 5 * DEFAULT_SECONDS_PER_CHAR);
  });

  it("does not let punctuation weigh more than a letter", () => {
    const { words } = timeLyricWords("oh ... yes", 0, 1);
    expect(words[1].end - words[1].start).toBeCloseTo(
      words[0].end - words[0].start - (words[0].end - words[0].start) / 2,
    );
  });
});

describe("timeLyricWords (enhanced LRC)", () => {
  it("uses the word stamps", () => {
    const { text, words } = timeLyricWords(
      "<00:12.00>Hello <00:12.80>world<00:13.50>",
      12,
      15,
    );
    expect(text).toBe("Hello world");
    expect(words).toEqual([
      { text: "Hello ", start: 12, end: 12.8 },
      { text: "world", start: 12.8, end: 13.5 },
    ]);
  });

  it("estimates the end of the last stamped word", () => {
    const { words } = timeLyricWords("<00:01.00>a <00:02.00>song", 1, 3);
    expect(words[1].start).toBe(2);
    expect(words[1].end).toBe(3);
  });

  it("times text before the first stamp from the line start", () => {
    const { words } = timeLyricWords("so <00:05.00>now", 4, 6);
    expect(words[0]).toMatchObject({ text: "so ", start: 4, end: 5 });
  });
});

describe("stripWordStamps", () => {
  it("removes stamps and extra spaces", () => {
    expect(stripWordStamps("<00:01.00>a  <00:02.5>b<00:03.00>")).toBe("a b");
  });
});

describe("wordFillPercent", () => {
  const word = { text: "x", start: 1, end: 2 };
  it("is empty before, full after and linear during the word", () => {
    expect(wordFillPercent(word, 0.5)).toBe(0);
    expect(wordFillPercent(word, 1.25)).toBe(25);
    expect(wordFillPercent(word, 3)).toBe(100);
  });
});
