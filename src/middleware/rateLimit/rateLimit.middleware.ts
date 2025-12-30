import { rateLimitService } from "@/services";
import { redisClient } from "@/services/redis";
import { TooManyRequestsError } from "@/util/errors";
import { logger } from "@/util/logger";
import { Request, Response, NextFunction } from "express";

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  identifierType: "ip" | "email";
  // login || register
  keyPrefix: string;
  message?: string;
}

function getIdentifier(req: Request, config: RateLimitConfig): string {
  if (config.identifierType === "email") {
    const email = (req.body as any)?.email;

    if (!email) {
      // fall back to ip
      return getClientIp(req);
    }

    return email.toLowerCase().trim();
  }

  //   default to ip
  return getClientIp(req);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];

  // "client, proxy1, proxy2"
  if (forwarded) {
    const ips =
      typeof forwarded === "string" ? forwarded.split(",") : forwarded;
    return ips[0]?.trim() || "";
  }

  // fallback to remote address
  return (
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

// format duration in seconds to human readable string

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  const hours = Math.floor(minutes / 60);

  return `${hours} hour${hours !== 1 ? "s" : ""}`;
}

export function rateLimitMiddleware(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!redisClient.isConnected()) {
        logger.error("Redis is not connected");
        return next();
      }

      const identifier = getIdentifier(req, config);

      // key
      const redisKey = `ratelimit:${config.keyPrefix}:${identifier}`;

      // check rate limit

      const { allowed, remaining, resetAt } =
        await rateLimitService.checkRateLimit(
          redisKey,
          config.maxRequests,
          config.windowSeconds
        );

      // set rate limit headers
      res.setHeader("X-RateLimit-Limit", config.maxRequests);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", resetAt.toISOString());

      if (!allowed) {
        logger.warn(`Rate limit exceeded for key: ${redisKey}`);

        const message =
          config.message || "Too many requests, please try again later.";
        throw new TooManyRequestsError(message);
      }

      next();
    } catch (error) {
        next(error);
    }
  };
}
