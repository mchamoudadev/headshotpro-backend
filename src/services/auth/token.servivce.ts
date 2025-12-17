import { config } from "@/config";
import { UserRole } from "@/models/User.model";
import { UnAuthorizedError } from "@/util/errors";
import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export class TokenService {
  // Generate access token
  generateAccessToken(payload: TokenPayload): string {
    const secret = this.getAccessSecret();
    const options: SignOptions = {
      expiresIn: config.jwt.expiresIn as StringValue,
    };
    return jwt.sign(payload, secret, options);
  }

  // Generate refresh token
  generateRefreshToken(payload: TokenPayload): string {
    const secret = this.getRefreshSecret();
    const options: SignOptions = {
      expiresIn: config.jwt.refreshExpiresIn as StringValue,
    };
    return jwt.sign(payload, secret, options);
  }

  // Verify access token
  verifyAccessToken(token: string): TokenPayload {
    const secret = this.getAccessSecret();
    try {
      return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
      throw new UnAuthorizedError("Invalid or expired token");
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): TokenPayload {
    const secret = this.getRefreshSecret();
    try {
      return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
      throw new UnAuthorizedError("Invalid or expired refresh token");
    }
  }

  //   Generate both access and refresh tokens

  generateTokenPair(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    // Generate both access and refresh tokens
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

 



  // Private helper methods
  private getAccessSecret(): string {
    const secret = config.jwt.secret;
    if (!secret) {
      throw new Error("JWT secret is not configured");
    }
    return secret;
  }

  private getRefreshSecret(): string {
    const secret = config.jwt.refreshSecret;
    if (!secret) {
      throw new Error("JWT refresh secret is not configured");
    }
    return secret;
  }
}

export const tokenService = new TokenService();
