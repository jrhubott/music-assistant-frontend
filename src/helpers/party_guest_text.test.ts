import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NICKNAME_MAX_LENGTH,
  cleanGuestText,
  loadNickname,
  saveNickname,
} from "./party_guest_text";

describe("cleanGuestText", () => {
  it("collapses whitespace and drops control characters", () => {
    expect(cleanGuestText("  Sam\n\u202e the\t DJ ", 40)).toBe("Sam the DJ");
  });

  it("cuts long text to the given length", () => {
    expect(cleanGuestText("x".repeat(50), NICKNAME_MAX_LENGTH)).toHaveLength(
      NICKNAME_MAX_LENGTH,
    );
  });

  it("keeps emoji", () => {
    expect(cleanGuestText("for Mike 🎂", 80)).toBe("for Mike 🎂");
  });

  it("returns an empty string for blank text", () => {
    expect(cleanGuestText(" \n ", 80)).toBe("");
  });
});

describe("nickname storage", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("remembers and forgets the nickname", () => {
    saveNickname("Sam");
    expect(loadNickname()).toBe("Sam");
    saveNickname("");
    expect(loadNickname()).toBe("");
  });

  it("works without site data", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveNickname("Sam")).not.toThrow();
    expect(loadNickname()).toBe("");
  });
});
