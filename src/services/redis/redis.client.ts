import { config } from "@/config";
import { AppError } from "@/util/errors";
import { logger } from "@/util/logger";
import { Redis } from "@upstash/redis";


class RedisClient {


    private client: Redis | null = null;
    private isEnabled: boolean = false;

    constructor() {
        this.initializeClient();
    }

    private initializeClient(): void {

        const { url, token } = config.upstash;

        if (!url || !token) {
            logger.warn("Redis is not enabled. Configuration is missing.");
            this.isEnabled = false;
            return;
        }

        try {
            this.client = new Redis({
                url,
                token,
            });

            this.isEnabled = true;
            logger.info("Redis client initialized successfully");
        } catch (error) {
            logger.error("Error initializing Redis client", error);
            this.isEnabled = false;
            throw new AppError("Failed to initialize Redis client", 500, "FAILED_TO_INITIALIZE_REDIS_CLIENT");
        }

    }

    // isConnected
    public isConnected(): boolean {
        return this.isEnabled;
    }

    // getClient
    public getClient(): Redis | null {
        return this.client;
    }

    // set value with expiration

    async setex(key: string, seconds: number, value: string): Promise<void> {


        if (!this.isConnected()) {
            throw new Error("Redis client is not connected");
        }

        try {
            await this.client?.setex(key, seconds, value);
        } catch (error) {
            logger.error("Error setting value with expiration", error);
            throw new AppError("Failed to set value with expiration", 500, "FAILED_TO_SET_VALUE_WITH_EXPIRATION");
        }
    }


    // get value

    async get(key: string): Promise<string | null> {


        if (!this.isConnected()) return null;

        try {
            return await this.client!.get(key);
        } catch (error) {
            logger.error("Error getting value", error);
            return null;
        }
    }

    // delete value
    async del(key: string): Promise<void> {
        if (!this.isConnected()) return;
        try {
            await this.client!.del(key);
        } catch (error) {
            logger.error("Error deleting value", error);
            throw new AppError("Failed to delete value", 500, "FAILED_TO_DELETE_VALUE");
        }
    }


    // Increment counter
    async incr(key: string): Promise<number> {
        if (!this.isConnected()) return 0;
        try {
            return await this.client!.incr(key);
        } catch (error) {
            logger.error("Error incrementing counter", error);
            throw new AppError("Failed to increment counter", 500, "FAILED_TO_INCREMENT_COUNTER");
        }
    }

    // Set Expiration Time

    async expire(key: string, seconds: number): Promise<void> {


        if (!this.isConnected()) return;
        try {
            await this.client!.expire(key, seconds);
        } catch (error) {
            logger.error("Error setting expiration time", error);
            throw new AppError("Failed to set expiration time", 500, "FAILED_TO_SET_EXPIRATION_TIME");
        }

    }


    // Get Time to Live (TTL)

    async ttl(key: string): Promise<number> {
        if (!this.isConnected()) return 0;
        try {
            return await this.client!.ttl(key);
        } catch (error) {
            logger.error("Error getting time to live", error);
            throw new AppError("Failed to get time to live", 500, "FAILED_TO_GET_TIME_TO_LIVE");
        }
    }
}


export const redisClient = new RedisClient();