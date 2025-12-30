import winston from "winston";
import path from "path";
import fs from "fs";

// logs directory

// colors for winston || chalk

const logsDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),

  transports: [
    // combine console and file transports
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              return `${timestamp} [${level}]: ${message} ${
                Object.keys(meta).length > 0 ? JSON.stringify(meta) : ""
              }`;
            })
          ),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      level: "warn", // Only log warnings and errors
      format: winston.format.combine( winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    )
    }),
    // Error log file
    new winston.transports.File({
        filename: path.join(logsDir, "error.log"),
        level: "error",
        format: winston.format.combine( winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
      })
  ],
});
