import { logger } from "@/util/logger";
import { redisClient } from "./redis.client";

class RedisCacheService {
  // set cache

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!redisClient.isConnected()) return;

    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.setex(key, ttl, serializedValue);
    } catch (error) {
      logger.error("Error setting cache", error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!redisClient.isConnected()) return null;

    try {
      const value = await redisClient.get(key);
      if(!value) return null;
      logger.info(`Cache hit for key: ${key} with value: ${JSON.stringify(value)}`);
      return JSON.parse(JSON.stringify(value)) as T;
    } catch (error) {
      logger.error("Error getting cache", error);
      return null;
    }
  }

  // delete cache
  async delete(key: string): Promise<void> {
    if (!redisClient.isConnected()) return;

    try {
      await redisClient.del(key);
      logger.info(`Cache deleted for key: ${key}`);
    } catch (error) {
      logger.error("Error deleting cache", error);
    }
  }

  // clear all cache using pattern

  async deletePattern(pattern: string): Promise<void> {
    if (!redisClient.isConnected()) return;

    try {
      const rawClient = redisClient.getClient();
      if (!rawClient) return;

      // order:page1, order:page2, order:page3, ...

      const keys: string[] = [];
      let cursor = 0;

      do {
        const result: any = await rawClient.scan(cursor, {
          match: pattern,
          count: 100,
        });

        if (Array.isArray(result) && result.length >= 2) {
          const cusrsorValue = result[0]; // 459 -> 0;
          const foundKeys = result[1]; // [order:page1, order:page2, order:page3, ...];

          cursor =
            typeof cusrsorValue === "number"
              ? cusrsorValue
              : parseInt(String(cusrsorValue), 10);

          // collect all found keys
          if (Array.isArray(foundKeys)) {
            keys.push(...foundKeys);
          } else {
            break;
          }
        }
      } while (cursor !== 0);

      if (keys.length > 0) {
        await Promise.all(keys.map((key) => redisClient.del(key)));
        logger.info(
          `Deleted ${keys.length} cache entries for pattern: ${pattern}`
        );
      }
    } catch (error) {
      logger.error("Error deleting cache pattern", error);
    }
  }
}

export const redisCacheService = new RedisCacheService();