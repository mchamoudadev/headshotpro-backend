import { config } from "@/config";
import { AppError, ValidationError } from "@/util/errors";
import { logger } from "@/util/logger";
import { errorResponse } from "@/util/response";
import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  logger.error(err.stack || err.message, {
    message: err.message,
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method
  });



  // handle operational errors

  if (err instanceof AppError) {
    const errors = err instanceof ValidationError ? err.errors : undefined;
    return errorResponse(res, err.message, err.statusCode, errors);
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    return errorResponse(res, "Validation failed", 400);
  }

  // Handle Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    return errorResponse(res, 'Duplicate field value', 409);
  }


    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return errorResponse(res, 'Invalid token', 401);
      }



  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401);
  }


    // Generic error (don't leak details in production)
    const message = config.env === 'development' 
    ? err.message 
    : 'Internal server error';

  return errorResponse(res, message, 500);
};
