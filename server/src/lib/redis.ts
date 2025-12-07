/**
 * Redis Client Configuration
 * 
 * Centralized Redis client for caching and optimization
 */

import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Create Redis client
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true; // Reconnect on READONLY error
    }
    return false;
  },
});

// Handle connection events
redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

redis.on("close", () => {
  console.log("⚠️ Redis connection closed");
});

// Cache utility functions
export class CacheService {
  private static readonly DEFAULT_TTL = 3600; // 1 hour default

  /**
   * Get cached data
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached data
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🗑️  Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Invalidate cache for a shop
   */
  static async invalidateShop(shopId: string): Promise<void> {
    console.log(`🔄 Invalidating cache for shop: ${shopId}`);
    await Promise.all([
      this.delPattern(`shop:${shopId}:*`),
      this.del(`dashboard:${shopId}`),
      this.del(`dashboard-analytics:${shopId}`), // Dashboard analytics cache
      this.del(`at-risk:${shopId}`), // At-risk inventory cache
      this.del(`products:${shopId}`),
      this.delPattern(`sales:${shopId}:*`),
      this.delPattern(`reports:${shopId}:*`), // Reports cache
    ]);
    console.log(`✅ Cache invalidated for shop: ${shopId}`);
  }

  /**
   * Get or set cached data (cache-aside pattern)
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch from source
    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }
}

export default redis;

