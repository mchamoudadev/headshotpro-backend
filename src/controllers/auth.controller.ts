import { authService } from "@/services";
import { createdResponse, successResponse } from "@/util/response";
import type { Request, Response } from "express";

export const register = async (req: Request, res: Response) => {
  // service call
  const { user } = await authService.registerUser(req.body);

  return createdResponse(res, "User registered successfully", {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
    },
  });
};
