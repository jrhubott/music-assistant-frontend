/**
 * Word timing for karaoke-style lyrics.
 *
 * Plain LRC only times whole lines, so a line's words are spread over the time
 * until the next line, weighted by their length. Enhanced LRC carries a
 * `<mm:ss.xx>` stamp before words; those stamps are used as given.
 */

export interface LyricWord {
  /** The word as displayed, including the space that follows it. */
  text: string;
  /** Second the word starts being sung. */
  start: number;
  /** Second the word is fully sung. */
  end: number;
}

export interface TimedLyricLine {
  /** Line text with any word stamps removed. */
  text: string;
  words: LyricWord[];
}

// Slowest pace an estimated line is spread over. A longer gap to the next line
// is an instrumental tail, so the words finish early instead of crawling.
export const MAX_SECONDS_PER_CHAR = 0.25;
// Pace for the last line, which has no next line to end at.
export const DEFAULT_SECONDS_PER_CHAR = 0.12;

const WORD_STAMP = /<(\d+):(\d+)(?:[.:](\d+))?>/g;
const WORD_CHAR = /[\p{L}\p{N}]/gu;

const stampToSeconds = (min: string, sec: string, frac?: string): number =>
  parseInt(min) * 60 + parseInt(sec) + (frac ? parseFloat(`0.${frac}`) : 0);

/** Remove enhanced LRC word stamps from a line's text. */
export const stripWordStamps = (text: string): string =>
  text.replace(WORD_STAMP, "").replace(/\s+/g, " ").trim();

// Letters and digits decide how long a word takes; punctuation alone counts once.
const wordWeight = (word: string): number =>
  Math.max(1, word.match(WORD_CHAR)?.length ?? 0);

const splitWords = (text: string): string[] =>
  text.split(/\s+/).filter(Boolean);

const textWeight = (text: string): number =>
  splitWords(text).reduce((sum, word) => sum + wordWeight(word), 0);

// Split text into words and spread [start, end] over them by weight.
const spreadWords = (text: string, start: number, end: number): LyricWord[] => {
  const parts = splitWords(text);
  const total = textWeight(text);
  const words: LyricWord[] = [];
  let cursor = start;
  for (const part of parts) {
    const wordEnd = cursor + ((end - start) * wordWeight(part)) / total;
    words.push({ text: part, start: cursor, end: wordEnd });
    cursor = wordEnd;
  }
  return words;
};

const withSpacing = (words: LyricWord[]): LyricWord[] =>
  words.map((word, i) => ({
    ...word,
    text: i < words.length - 1 ? `${word.text} ` : word.text,
  }));

/**
 * Time the words of one lyric line.
 *
 * @param rawText Line text after the line stamp, possibly with word stamps.
 * @param lineStart Second the line starts.
 * @param nextLineStart Second the next line starts, or undefined for the last line.
 */
export const timeLyricWords = (
  rawText: string,
  lineStart: number,
  nextLineStart?: number,
): TimedLyricLine => {
  const text = stripWordStamps(rawText);
  // When text starting at `start` is done, given only the line timing.
  const estimatedEnd = (segmentText: string, start: number): number => {
    const chars = textWeight(segmentText);
    return nextLineStart === undefined
      ? start + chars * DEFAULT_SECONDS_PER_CHAR
      : Math.min(nextLineStart, start + chars * MAX_SECONDS_PER_CHAR);
  };

  const stamps = [...rawText.matchAll(WORD_STAMP)];
  if (!stamps.length) {
    return {
      text,
      words: withSpacing(
        spreadWords(text, lineStart, estimatedEnd(text, lineStart)),
      ),
    };
  }

  // Enhanced LRC: each stamp starts the text after it, which runs to the next
  // stamp. Text before the first stamp starts with the line.
  const segments: { text: string; start: number }[] = [];
  const leading = rawText.slice(0, stamps[0].index);
  if (leading.trim()) segments.push({ text: leading, start: lineStart });
  stamps.forEach((stamp, i) => {
    const textEnd = i + 1 < stamps.length ? stamps[i + 1].index : undefined;
    segments.push({
      text: rawText.slice(stamp.index + stamp[0].length, textEnd),
      start: stampToSeconds(stamp[1], stamp[2], stamp[3]),
    });
  });

  const words: LyricWord[] = [];
  segments.forEach((segment, i) => {
    if (!segment.text.trim()) return;
    // A closing stamp with no text after it marks where the last word ends.
    const segmentEnd =
      i + 1 < segments.length
        ? segments[i + 1].start
        : estimatedEnd(segment.text, segment.start);
    words.push(
      ...spreadWords(
        segment.text,
        segment.start,
        Math.max(segment.start, segmentEnd),
      ),
    );
  });
  return { text, words: withSpacing(words) };
};

/** Percent (0 to 100) of a word that has been sung at the given position. */
export const wordFillPercent = (word: LyricWord, position: number): number => {
  if (position <= word.start) return 0;
  if (position >= word.end) return 100;
  return ((position - word.start) / (word.end - word.start)) * 100;
};
