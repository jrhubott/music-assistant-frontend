import { useRateLimiting } from "@/composables/useRateLimiting";
import type { PartyConfig } from "@/plugins/api/interfaces";
import { beforeEach, describe, expect, it } from "vitest";

const CONFIG = {
  enable_rate_limiting: true,
  enable_add_queue: true,
  enable_boost: true,
  enable_skip_song: true,
  add_queue_limit: 2,
  add_queue_refill_minutes: 60,
  boost_limit: 1,
  boost_refill_minutes: 60,
  skip_song_limit: 1,
  skip_song_refill_minutes: 60,
} as PartyConfig;

const setup = () => {
  const limits = useRateLimiting();
  limits.configure(CONFIG);
  limits.startCountdown()();
  return limits;
};

describe("tokens from the party host", () => {
  beforeEach(() => localStorage.clear());

  it("adds extra tokens above a full bucket", () => {
    const limits = setup();
    limits.applyHostTokens({ granted: 2, reset_id: null });
    expect(limits.boostTokens.value).toBe(3);
    expect(limits.addQueueTokens.value).toBe(4);
  });

  it("spends the bucket first and then the extra tokens", () => {
    const limits = setup();
    limits.applyHostTokens({ granted: 1, reset_id: null });
    expect(limits.consumeBoostToken()).toBe(true);
    expect(limits.consumeBoostToken()).toBe(true);
    expect(limits.boostTokens.value).toBe(0);
    expect(limits.consumeBoostToken()).toBe(false);
  });

  it("refills once for each reset", () => {
    const limits = setup();
    limits.consumeBoostToken();
    limits.applyHostTokens({ granted: 0, reset_id: "first" });
    expect(limits.boostTokens.value).toBe(1);
    limits.consumeBoostToken();
    limits.applyHostTokens({ granted: 0, reset_id: "first" });
    expect(limits.boostTokens.value).toBe(0);
  });
});
