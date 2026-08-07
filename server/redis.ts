import Redis, { type RedisOptions } from "ioredis";

let redisClient: Redis | null = null;

export function hasRedisConfiguration() {
  return Boolean(
    process.env.REDIS_URL?.trim() || process.env.REDIS_HOST?.trim()
  );
}

/**
 * Get or create Redis client
 */
export function getRedis(): Redis {
  if (!redisClient) {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST?.trim() || "localhost",
      port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD,
      db: Number.parseInt(process.env.REDIS_DB || "0", 10),
      retryStrategy: (times: number) =>
        times <= 3 ? Math.min(times * 100, 500) : null,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      connectTimeout: 2_000,
      maxRetriesPerRequest: 1,
    };
    const redisUrl = process.env.REDIS_URL?.trim();
    redisClient = redisUrl ? new Redis(redisUrl, options) : new Redis(options);

    redisClient.on("error", (err: any) => {
      console.error("[Redis] Connection error:", err);
    });

    redisClient.on("connect", () => {
      console.log("[Redis] Connected successfully");
    });
  }

  return redisClient;
}

/**
 * Session storage
 */
export const sessionStore = {
  async set(sessionId: string, data: any, ttl: number = 86400) {
    const redis = getRedis();
    await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
  },

  async get(sessionId: string) {
    const redis = getRedis();
    const data = await redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  },

  async delete(sessionId: string) {
    const redis = getRedis();
    await redis.del(`session:${sessionId}`);
  },
};

/**
 * Queue management for random chat
 */
export const queueManager = {
  async addToQueue(userId: number, preferences: any) {
    const redis = getRedis();
    await redis.zadd(
      "chat:queue",
      Date.now(),
      JSON.stringify({ userId, preferences })
    );
  },

  async removeFromQueue(userId: number) {
    const redis = getRedis();
    const queue = await redis.zrange("chat:queue", 0, -1);
    for (const item of queue) {
      const data = JSON.parse(item);
      if (data.userId === userId) {
        await redis.zrem("chat:queue", item);
      }
    }
  },

  async getQueue(limit: number = 100) {
    const redis = getRedis();
    const queue = await redis.zrange("chat:queue", 0, limit - 1);
    return queue.map((item: any) => JSON.parse(item));
  },

  async getQueueSize() {
    const redis = getRedis();
    return await redis.zcard("chat:queue");
  },
};

/**
 * Presence tracking
 */
export const presenceTracker = {
  async setPresence(userId: number, status: "online" | "away" | "offline") {
    const redis = getRedis();
    await redis.hset("presence", `user:${userId}`, status);
    await redis.expire("presence", 86400); // 24 hours
  },

  async getPresence(userId: number) {
    const redis = getRedis();
    return await redis.hget("presence", `user:${userId}`);
  },

  async getAllPresence() {
    const redis = getRedis();
    return await redis.hgetall("presence");
  },

  async removePresence(userId: number) {
    const redis = getRedis();
    await redis.hdel("presence", `user:${userId}`);
  },
};

/**
 * Rate limiting
 */
export const rateLimiter = {
  async checkLimit(
    key: string,
    limit: number,
    window: number = 60
  ): Promise<boolean> {
    const redis = getRedis();
    const current = await redis.incr(`ratelimit:${key}`);

    if (current === 1) {
      await redis.expire(`ratelimit:${key}`, window);
    }

    return current <= limit;
  },

  async getCount(key: string): Promise<number> {
    const redis = getRedis();
    const count = await redis.get(`ratelimit:${key}`);
    return count ? parseInt(count) : 0;
  },

  async reset(key: string) {
    const redis = getRedis();
    await redis.del(`ratelimit:${key}`);
  },
};

/**
 * Message caching
 */
export const messageCache = {
  async set(conversationId: string, messages: any[]) {
    const redis = getRedis();
    await redis.setex(
      `messages:${conversationId}`,
      3600, // 1 hour TTL
      JSON.stringify(messages)
    );
  },

  async get(conversationId: string) {
    const redis = getRedis();
    const data = await redis.get(`messages:${conversationId}`);
    return data ? JSON.parse(data) : null;
  },

  async invalidate(conversationId: string) {
    const redis = getRedis();
    await redis.del(`messages:${conversationId}`);
  },

  async invalidateAll() {
    const redis = getRedis();
    const keys = await redis.keys("messages:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
