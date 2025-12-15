import { IUser, User } from "@/models/User.model";
import { registerInput } from "@/validators/auth.validator";
import { passwordService } from "./password.service";
import { verificationService } from "./verfication.service";
import { ConflictError, ExternalServiceError } from "@/util/errors";
import { emailService, EmailService } from "../notification/email.service";
import { logger } from "@/util/logger";

export class AuthService {
  // register user

  async registerUser(input: registerInput): Promise<{ user: IUser }> {
    // TODO: Implement user registration logic

    // normalize email to lowercase
    const normalizedEmail = this.normalizeEmail(input.email);

    // check if user exists

    await this.checkUSerExists(normalizedEmail);

    // hash password

    const hashedPassword = await passwordService.hashPassword(input.password);

    // Generate verification token

    const verificationToken = verificationService.generateToken();
    const verificationTokenExpires =
      verificationService.generateExpirationDate();

    // Create user

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: input.name,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationTokenExpires,
      isEmailVerified: false,
    });

    // Send verification email
    try {
        await emailService.sendVerificationEmail(normalizedEmail, input.name, verificationToken);
    } catch (error) {
        logger.error('Error sending verification email', error);
        throw new ExternalServiceError('Email Service', 'Failed to send verification email');
    }

    return {
      user,
    };
  }

//  https://myaccount.google.com/apppasswords

  private async checkUSerExists(email: string): Promise<void> {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ConflictError(
        `User already exists with this email address ${email}`
      );
    }
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }
}

export const authService = new AuthService();
