import { rateLimitMiddleware } from "../rateLimit.middleware";

export const apiRateLimitConfig = {


    general : rateLimitMiddleware({
        maxRequests: 10,
        windowSeconds: 60, // 1 minute
        identifierType: 'ip',
        keyPrefix: 'api:general', // api rate limit:general
    })




}