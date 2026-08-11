/**
 * Token-bucket rate limiter backed by Redis (or an in-process fallback).
 *
 * The previous security.ts createRateLimiter held an in-memory Map keyed by
 * `req.ip` that was never mounted in the request pipeline, so every endpoint
 * ran without a rate limit. This module exposes `consume()` and `reset()`
 * helpers plus a periodic cleanup hook. Tests can inject a custom backend.
 */
import { getRedis, hasRedisConfiguration } from "./redis";

export interface RateLimitBackend {
  // Returns the new count after this attempt. If `allowed` is false, the
  // caller has exceeded the cap.
  consume(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<{
    allowed: boolean;
    count: number;
    retryInMs?: number;
  }>;
  reset(key: string): Promise<void>;
}

class RedisBackend implements RateLimitBackend {
  async consume(key: string, limit: number, windowMs: number) {
    const redis = getRedis();
    const fullKey = `rl:${key}`;
    const count = await redis.incr(fullKey);
    if (count === 1) {
      await redis.pexpire(fullKey, windowMs);
    }
    const allowed = count <= limit;
    let retryInMs: number | undefined;
    if (!allowed) {
      const pttl = await redis.pttl(fullKey);
      retryInMs = pttl > 0 ? pttl : windowMs;
    }
    return { allowed, count, retryInMs };
  }
  async reset(key: string) {
    const redis = getRedis();
    await redis.del(`rl:${key}`);
  }
}

class InMemoryBackend implements RateLimitBackend {
  private buckets = new Map<string, { count: number; expiresAt: number }>();

  async consume(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.expiresAt <= now) {
      this.buckets.set(key, { count: 1, expiresAt: now + windowMs });
      return { allowed: true, count: 1 };
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      return {
        allowed: false,
        count: bucket.count,
        retryInMs: bucket.expiresAt - now,
      };
    }
    return { allowed: true, count: bucket.count };
  }

  async reset(key: string) {
    this.buckets.delete(key);
  }

  // Sweep expired buckets; called from the hourly cron.
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.buckets.entries()) {
      if (value.expiresAt <= now) this.buckets.delete(key);
    }
  }
}

const memory = new InMemoryBackend();
let backend: RateLimitBackend = hasRedisConfiguration()
  ? new RedisBackend()
  : memory;
let redisFallbackWasLogged = false;

export function configureRateLimitBackend(b: RateLimitBackend) {
  backend = b;
}

export async function consumeRate(
  key: string,
  limit: number,
  windowMs: number
) {
  try {
    return await backend.consume(key, limit, windowMs);
  } catch (error) {
    if (!(backend instanceof RedisBackend)) throw error;

    if (!redisFallbackWasLogged) {
      console.warn(
        "[RateLimit] Redis unavailable; using in-memory rate limiting"
      );
      redisFallbackWasLogged = true;
    }
    backend = memory;
    return memory.consume(key, limit, windowMs);
  }
}

export async function resetRate(key: string) {
  try {
    return await backend.reset(key);
  } catch (error) {
    if (!(backend instanceof RedisBackend)) throw error;
    backend = memory;
    return memory.reset(key);
  }
}

export async function cleanupRateLimitBuckets() {
  memory.cleanup();
}

/**
 * Express middleware: applies a named bucket per IP with a configurable cap.
 */
export function rateLimitMiddleware(
  bucket: string,
  limit: number,
  windowMs: number
) {
  return async (req: any, res: any, next: any) => {
    try {
      const ip = req.ip ?? "unknown";
      const result = await consumeRate(`${bucket}:${ip}`, limit, windowMs);
      if (!result.allowed) {
        res.setHeader(
          "Retry-After",
          String(Math.ceil((result.retryInMs ?? windowMs) / 1000))
        );
        res.status(429).json({ error: "Too many requests" });
        return;
      }
      next();
    } catch (err) {
      console.error("[RateLimit] error:", err);
      next();
    }
  };
}
