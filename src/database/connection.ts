import mongoose from "mongoose";
import { config } from "@/config";
import { logger } from "@/util/logger";

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(config.database.url)
       logger.info("Connected to database")
    } catch (error) {
        logger.error("Error connecting to database", error)
       throw new Error("Error connecting to database")
    }
}


mongoose.connection.on("disconnected", () => {
    logger.info("Disconnected from database")
    throw new Error("Disconnected from database")
})

mongoose.connection.on("error", (error) => {
    logger.error("Error connecting to database", error)
    throw new Error("Error connecting to database")
})