// Text a party guest types for the party screen: their nickname and shout-outs.
// The server cleans the same text again; this keeps what the guest sees in the
// input in line with what ends up on the screen.

export const NICKNAME_MAX_LENGTH = 24;
export const SHOUT_OUT_MAX_LENGTH = 80;

const NICKNAME_STORAGE_KEY = "party.guest_nickname";

// Control and format characters (newlines, direction overrides)
const INVISIBLE_CHARACTERS = /[\p{Cc}\p{Cf}\p{Co}\p{Cn}]/gu;

/**
 * Return guest-entered text fit for the party screen: no control characters,
 * whitespace collapsed and cut to the given length. Empty when nothing is left.
 */
export function cleanGuestText(value: string, maxLength: number): string {
  return value
    .replace(/\s/g, " ")
    .replace(INVISIBLE_CHARACTERS, "")
    .split(" ")
    .filter(Boolean)
    .join(" ")
    .slice(0, maxLength)
    .trim();
}

/**
 * Read the nickname this device used before, or an empty string.
 *
 * Also empty when site data is blocked, as it is in a private window.
 */
export function loadNickname(): string {
  try {
    return cleanGuestText(
      localStorage.getItem(NICKNAME_STORAGE_KEY) ?? "",
      NICKNAME_MAX_LENGTH,
    );
  } catch {
    return "";
  }
}

/** Remember the nickname on this device; an empty nickname forgets it. */
export function saveNickname(nickname: string): void {
  try {
    if (nickname) {
      localStorage.setItem(NICKNAME_STORAGE_KEY, nickname);
    } else {
      localStorage.removeItem(NICKNAME_STORAGE_KEY);
    }
  } catch {
    // site data is blocked: the nickname lasts until the page is closed
  }
}
