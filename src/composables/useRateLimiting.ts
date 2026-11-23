/**
 * Token bucket rate limiting composable for the Party participant view.
 * Manages boost, add-to-queue, and skip-song token buckets
 * with browser-wide persistence and countdown timers. Buckets contain
 * only token counts and timestamps, never participant identity.
 */

import { ref, type Ref } from "vue";
import type { PartyConfig } from "@/plugins/api/interfaces";

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const BOOST_STORAGE_KEY = "guest_boost_bucket";
const ADD_QUEUE_STORAGE_KEY = "guest_add_queue_bucket";
const SKIP_SONG_STORAGE_KEY = "guest_skip_song_bucket";
const BONUS_STORAGE_KEY = "guest_bonus_tokens";
const RESET_STORAGE_KEY = "guest_token_reset_id";

type TokenKind = "boost" | "add" | "skip";
type BonusTokens = Record<TokenKind, number>;

export interface PartyGuestTokens {
  granted: number;
  reset_id: string | null;
}

const NO_BONUS: BonusTokens = { boost: 0, add: 0, skip: 0 };

// Tokens from the host sit on top of the bucket, so a full bucket cannot cap them
const loadBonus = (): BonusTokens => {
  try {
    const stored = localStorage.getItem(BONUS_STORAGE_KEY);
    return stored ? { ...NO_BONUS, ...JSON.parse(stored) } : { ...NO_BONUS };
  } catch {
    return { ...NO_BONUS };
  }
};

const saveBonus = (bonus: BonusTokens) => {
  localStorage.setItem(BONUS_STORAGE_KEY, JSON.stringify(bonus));
};

export function useRateLimiting() {
  // Default values (will be overridden by server config)
  const BOOST_MAX_TOKENS = ref(3);
  const BOOST_REFILL_RATE = ref(1000 * 60 * 20); // 20 minutes

  const ADD_QUEUE_MAX_TOKENS = ref(10);
  const ADD_QUEUE_REFILL_RATE = ref(1000 * 60 * 2); // 2 minutes per token

  const SKIP_SONG_MAX_TOKENS = ref(1);
  const SKIP_SONG_REFILL_RATE = ref(1000 * 60 * 60); // 60 minutes per token

  // Feature toggles
  const rateLimitingEnabled = ref(true);
  const addQueueEnabled = ref(true);
  const boostEnabled = ref(true);
  const skipSongEnabled = ref(true);

  // Badge colors
  const requestBadgeColor = ref("");
  const boostBadgeColor = ref("");

  // Token counts
  const boostTokens = ref(3);
  const addQueueTokens = ref(10);
  const skipSongTokens = ref(1);

  // Countdown displays
  const nextTokenCountdown = ref<string>("");
  const addQueueTokenCountdown = ref<string>("");
  const skipTokenCountdown = ref<string>("");

  let countdownInterval: ReturnType<typeof setInterval> | null = null;

  // --- Internal helpers ---

  const loadTokenBucket = (
    storageKey: string,
    maxTokens: number,
    refillRate: number,
  ): TokenBucket => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return {
        tokens: maxTokens,
        lastRefill: Date.now(),
      };
    }

    try {
      const bucket: TokenBucket = JSON.parse(stored);
      const now = Date.now();
      const timeSinceRefill = now - bucket.lastRefill;
      const tokensToAdd = Math.floor(timeSinceRefill / refillRate);

      if (tokensToAdd > 0) {
        bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
      } else {
        // Always clamp to maxTokens in case config changed since last save
        bucket.tokens = Math.min(maxTokens, bucket.tokens);
      }

      return bucket;
    } catch {
      return {
        tokens: maxTokens,
        lastRefill: Date.now(),
      };
    }
  };

  const saveTokenBucket = (storageKey: string, bucket: TokenBucket) => {
    localStorage.setItem(storageKey, JSON.stringify(bucket));
  };

  const consumeToken = (
    storageKey: string,
    maxTokens: number,
    refillRate: number,
    tokenRef: Ref<number>,
    kind: TokenKind,
  ): boolean => {
    const bucket = loadTokenBucket(storageKey, maxTokens, refillRate);
    const bonus = loadBonus();
    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      saveTokenBucket(storageKey, bucket);
    } else if (bonus[kind] > 0) {
      bonus[kind] -= 1;
      saveBonus(bonus);
    } else {
      return false;
    }
    tokenRef.value = bucket.tokens + bonus[kind];
    return true;
  };

  const getTimeUntilNextTokenRefill = (
    storageKey: string,
    maxTokens: number,
    refillRate: number,
  ): number => {
    const bucket = loadTokenBucket(storageKey, maxTokens, refillRate);
    if (bucket.tokens >= maxTokens) {
      return 0;
    }

    const timeSinceRefill = Date.now() - bucket.lastRefill;
    const timeUntilNext = refillRate - (timeSinceRefill % refillRate);
    return Math.ceil(timeUntilNext / 1000 / 60); // Return minutes
  };

  const formatCountdown = (milliseconds: number): string => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${seconds}s`;
  };

  const updateCountdown = () => {
    const bonus = loadBonus();
    // Update Boost tokens
    const boostBucket = loadTokenBucket(
      BOOST_STORAGE_KEY,
      BOOST_MAX_TOKENS.value,
      BOOST_REFILL_RATE.value,
    );
    boostTokens.value = boostBucket.tokens + bonus.boost;

    if (boostBucket.tokens >= BOOST_MAX_TOKENS.value) {
      nextTokenCountdown.value = "";
    } else {
      const timeSinceRefill = Date.now() - boostBucket.lastRefill;
      const timeUntilNext =
        BOOST_REFILL_RATE.value - (timeSinceRefill % BOOST_REFILL_RATE.value);
      nextTokenCountdown.value = formatCountdown(timeUntilNext);
    }

    // Update Add Queue tokens
    const addQueueBucket = loadTokenBucket(
      ADD_QUEUE_STORAGE_KEY,
      ADD_QUEUE_MAX_TOKENS.value,
      ADD_QUEUE_REFILL_RATE.value,
    );
    addQueueTokens.value = addQueueBucket.tokens + bonus.add;

    if (addQueueBucket.tokens >= ADD_QUEUE_MAX_TOKENS.value) {
      addQueueTokenCountdown.value = "";
    } else {
      const timeSinceRefill = Date.now() - addQueueBucket.lastRefill;
      const timeUntilNext =
        ADD_QUEUE_REFILL_RATE.value -
        (timeSinceRefill % ADD_QUEUE_REFILL_RATE.value);
      addQueueTokenCountdown.value = formatCountdown(timeUntilNext);
    }

    // Update Skip Song tokens
    const skipBucket = loadTokenBucket(
      SKIP_SONG_STORAGE_KEY,
      SKIP_SONG_MAX_TOKENS.value,
      SKIP_SONG_REFILL_RATE.value,
    );
    skipSongTokens.value = skipBucket.tokens + bonus.skip;

    if (skipBucket.tokens >= SKIP_SONG_MAX_TOKENS.value) {
      skipTokenCountdown.value = "";
    } else {
      const timeSinceRefill = Date.now() - skipBucket.lastRefill;
      const timeUntilNext =
        SKIP_SONG_REFILL_RATE.value -
        (timeSinceRefill % SKIP_SONG_REFILL_RATE.value);
      skipTokenCountdown.value = formatCountdown(timeUntilNext);
    }
  };

  // --- Public API ---

  const consumeBoostToken = (): boolean =>
    consumeToken(
      BOOST_STORAGE_KEY,
      BOOST_MAX_TOKENS.value,
      BOOST_REFILL_RATE.value,
      boostTokens,
      "boost",
    );

  const consumeAddQueueToken = (): boolean =>
    consumeToken(
      ADD_QUEUE_STORAGE_KEY,
      ADD_QUEUE_MAX_TOKENS.value,
      ADD_QUEUE_REFILL_RATE.value,
      addQueueTokens,
      "add",
    );

  const consumeSkipSongToken = (): boolean =>
    consumeToken(
      SKIP_SONG_STORAGE_KEY,
      SKIP_SONG_MAX_TOKENS.value,
      SKIP_SONG_REFILL_RATE.value,
      skipSongTokens,
      "skip",
    );

  const getTimeUntilNextToken = (): number =>
    getTimeUntilNextTokenRefill(
      BOOST_STORAGE_KEY,
      BOOST_MAX_TOKENS.value,
      BOOST_REFILL_RATE.value,
    );

  const getTimeUntilNextAddQueueToken = (): number =>
    getTimeUntilNextTokenRefill(
      ADD_QUEUE_STORAGE_KEY,
      ADD_QUEUE_MAX_TOKENS.value,
      ADD_QUEUE_REFILL_RATE.value,
    );

  const getTimeUntilNextSkipToken = (): number =>
    getTimeUntilNextTokenRefill(
      SKIP_SONG_STORAGE_KEY,
      SKIP_SONG_MAX_TOKENS.value,
      SKIP_SONG_REFILL_RATE.value,
    );

  /**
   * Apply a token reset and extra tokens from the party host.
   */
  const applyHostTokens = (update: PartyGuestTokens) => {
    if (
      update.reset_id &&
      localStorage.getItem(RESET_STORAGE_KEY) !== update.reset_id
    ) {
      localStorage.setItem(RESET_STORAGE_KEY, update.reset_id);
      localStorage.removeItem(BOOST_STORAGE_KEY);
      localStorage.removeItem(ADD_QUEUE_STORAGE_KEY);
      localStorage.removeItem(SKIP_SONG_STORAGE_KEY);
      localStorage.removeItem(BONUS_STORAGE_KEY);
    }
    if (update.granted > 0) {
      const bonus = loadBonus();
      bonus.boost += update.granted;
      bonus.add += update.granted;
      bonus.skip += update.granted;
      saveBonus(bonus);
    }
    updateCountdown();
  };

  /**
   * Apply server config to rate limiting parameters.
   * Called after fetching party/config from the server.
   */
  const configure = (config: PartyConfig) => {
    rateLimitingEnabled.value = config.enable_rate_limiting ?? true;
    addQueueEnabled.value = config.enable_add_queue ?? true;
    boostEnabled.value = config.enable_boost ?? true;
    skipSongEnabled.value = config.enable_skip_song ?? true;

    ADD_QUEUE_MAX_TOKENS.value = config.add_queue_limit ?? 10;
    ADD_QUEUE_REFILL_RATE.value =
      (config.add_queue_refill_minutes ?? 2) * 60 * 1000;
    BOOST_MAX_TOKENS.value = config.boost_limit ?? 3;
    BOOST_REFILL_RATE.value = (config.boost_refill_minutes ?? 20) * 60 * 1000;
    SKIP_SONG_MAX_TOKENS.value = config.skip_song_limit ?? 1;
    SKIP_SONG_REFILL_RATE.value =
      (config.skip_song_refill_minutes ?? 60) * 60 * 1000;

    requestBadgeColor.value = config.request_badge_color ?? "#2196F3";
    boostBadgeColor.value = config.boost_badge_color ?? "#FF5722";
  };

  /**
   * Initialize browser-wide token buckets and start the countdown timer.
   *
   * Returns a cleanup function to clear the interval.
   */
  const startCountdown = (): (() => void) => {
    // Initialize token buckets
    const boostBucket = loadTokenBucket(
      BOOST_STORAGE_KEY,
      BOOST_MAX_TOKENS.value,
      BOOST_REFILL_RATE.value,
    );
    boostTokens.value = boostBucket.tokens;

    const addQueueBucket = loadTokenBucket(
      ADD_QUEUE_STORAGE_KEY,
      ADD_QUEUE_MAX_TOKENS.value,
      ADD_QUEUE_REFILL_RATE.value,
    );
    addQueueTokens.value = addQueueBucket.tokens;

    const skipSongBucket = loadTokenBucket(
      SKIP_SONG_STORAGE_KEY,
      SKIP_SONG_MAX_TOKENS.value,
      SKIP_SONG_REFILL_RATE.value,
    );
    skipSongTokens.value = skipSongBucket.tokens;

    // Start countdown timer
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    };
  };

  return {
    // Reactive state for template
    rateLimitingEnabled,
    boostEnabled,
    addQueueEnabled,
    skipSongEnabled,
    requestBadgeColor,
    boostBadgeColor,
    boostTokens,
    addQueueTokens,
    skipSongTokens,
    BOOST_MAX_TOKENS,
    ADD_QUEUE_MAX_TOKENS,
    SKIP_SONG_MAX_TOKENS,
    nextTokenCountdown,
    addQueueTokenCountdown,
    skipTokenCountdown,
    // Actions
    consumeBoostToken,
    consumeAddQueueToken,
    consumeSkipSongToken,
    getTimeUntilNextToken,
    getTimeUntilNextAddQueueToken,
    getTimeUntilNextSkipToken,
    configure,
    startCountdown,
    applyHostTokens,
  };
}
