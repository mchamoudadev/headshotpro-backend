import { rateLimitMiddleware } from "../rateLimit.middleware";

export const authRateLimitConfig = {
    login : rateLimitMiddleware({
        maxRequests: 5,
        windowSeconds: 60, // 1 minute
        identifierType: 'email',
        keyPrefix: 'auth:login', // auth rate limit:login
    }),
    register : rateLimitMiddleware({
        maxRequests: 5,
        windowSeconds: 60,
        identifierType: 'email',
        keyPrefix: 'auth:register',
    }),
}