import { z, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import { logger } from "@/util/logger";
import { AppError, ValidationError } from "@/util/errors";

export const validate = (schema: z.ZodType<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);

      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // convert zod error to json

        const errors = error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));
        next(new ValidationError("Validation error", errors));
      } else {
        next(new AppError("Validation error", 400));
      }
    }
  };
};
