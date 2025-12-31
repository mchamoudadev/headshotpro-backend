import { config } from "@/config";
import { authService } from "@/services";
import { UnAuthorizedError, ValidationError } from "@/util/errors";
import { createdResponse, successResponse } from "@/util/response";
import type { Request, Response } from "express";

const cookieOptions = {
  httpOnly: true,
  secure: config.env === "production",
  sameSite: "lax" as const,
  path: "/",
  domain: config.env === "production" ? ".mchamouda.store" : undefined, // Add this line
};

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

// Verify emnail

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    throw new ValidationError("Verification token is required");
  }

  // verifiction service
  await authService.verifyEmail(token);

  return successResponse(res, "Email verfied successfully");
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError("Email is required");
  }

  // Resend service

  await authService.resendVerificationEmail(email);

  return successResponse(res, "Verification email sent successfully");
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  // login service
  const { user, accessToken, refreshToken } = await authService.login(
    email,
    password
  );

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return successResponse(res, "Login successful", {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user?.userId as string);

  return successResponse(res, "User fetched successfully", {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      credits: user.credits,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    throw new UnAuthorizedError("refresh token is required");
  }

  // refrsh token service
  const tokens = await authService.refreshAccessToken(token);

  res.cookie("accessToken", tokens.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return successResponse(res, "Token refreshed successfully");
};

export const logout = async (req: Request, res: Response) => {
  let token = req.cookies?.accessToken;
  if (!token) {
    const authHeaders = req.headers.authorization;

    if (authHeaders?.startsWith("Bearer ")) {
      token = authHeaders.substring(7);
    }
  }

  if(token){
    const user = await authService.logout(req.user?.userId as string);
  }

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
  return successResponse(res, "Logged out successfully");
};
