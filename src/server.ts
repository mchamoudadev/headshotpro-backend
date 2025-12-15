import app from "@/app";
import { config } from "@/config";
import { connectDatabase } from "@/database/connection";
import { logger } from "./util/logger";

const startServer = async () => {
  try {
    // connect to database

    if (config.env === "production") {
      console.log("Connecting to production database");
      await connectDatabase();
    } else {
      console.log("Connecting to development database");
      await connectDatabase();
    }

    const server = app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      } else {
        logger.error(`Error starting server on port ${config.port}`, error);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error("Fatal error in server startup", error);
    // process.exit(1);
  }
};

startServer();
