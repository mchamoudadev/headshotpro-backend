import { logger } from "@/util/logger";
import { redisClient } from "./redis.client";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

class RedisRateLimitService {
  // check rate limit with increment counter
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    // Fail open: If Redis is down, return true (allow request)

    if (!redisClient.isConnected()) {
      return {
        allowed: true,
        remaining: limit,
        resetAt: new Date(Date.now() + windowSeconds * 1000),
      };
    }

    try {
      // Incremnet counter for current requests

      const count = await redisClient.incr(key);

      // set expiration time

      if (count === 1) {
        // Set expiration time for the first request
        await redisClient.expire(key, windowSeconds);
      }

      // Calculate remaining requests
      const allowed = count <= limit;

      const remaining = Math.max(0, limit - count);
      // get time to live
      const ttl = await redisClient.ttl(key);
      const resetAt = Date.now() + ttl * 1000;

      if (!allowed) {
        logger.warn(`Rate limit exceeded for key: ${key}`);
      }
      return {
        allowed,
        remaining: remaining,
        resetAt: new Date(resetAt),
      };
    } catch (error) {
      logger.error("Error checking rate limit", error);

      // Return true to allow request
      return {
        allowed: true,
        remaining: limit,
        resetAt: new Date(Date.now() + windowSeconds * 1000),
      };
    }
  }

  //   reset rate limit
  async resetRateLimit(key: string): Promise<void> {
    if (!redisClient.isConnected()) return;
    try {
      await redisClient.del(key);
      logger.info(`Rate limit reset for key: ${key}`);
    } catch (error) {
      logger.error("Error resetting rate limit", error);
    }
  }

  //   get rate limit without increment counter

  async getRateLimit(
    key: string,
    limit: number,
  ): Promise<RateLimitResult> {
    if (!redisClient.isConnected()) {
      return {
        allowed: true,
        remaining: limit,
        resetAt: new Date(Date.now()),
      };
    }

    try {

        const count = await redisClient.get(key);
        const currentCount = count ? parseInt(count, 10) : 0;
        const ttl = await redisClient.ttl(key);
  
        return {
          allowed: currentCount < limit,
          remaining: Math.max(0, limit - currentCount),
          resetAt: new Date(Date.now() + ttl * 1000),
        };

    } catch (error) {
        logger.error("Error getting rate limit", error);
        return {
            allowed: true,
            remaining: limit,
            resetAt: new Date(Date.now()),
        };
    }
  }
}

export const rateLimitService = new RedisRateLimitService();
