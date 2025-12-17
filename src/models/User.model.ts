import mongoose, {Document, Schema} from "mongoose";

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface IUser extends Document {
    email: string;
    password: string;
    name?: string;
    credits: number;
    refreshToken?: string;
    isActive: boolean;
    role: UserRole;
    isEmailVerified: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
  }


  const userSchema = new Schema<IUser>(
    {
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false, // Don't include password in queries by default
      },
      name: {
        type: String,
        trim: true,
      },
      credits: {
        type: Number,
        default: 5, // Free credits on signup
      },
      refreshToken: {
        type: String,
        select: false,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      role: {
        type: String,
        enum: UserRole,
        default: UserRole.USER,
      },
      isEmailVerified: {
        type: Boolean,
        default: false,
      },
      emailVerificationToken: {
        type: String,
        select: false,
      },
      emailVerificationExpires: {
        type: Date,
        select: false,
      },
    },
    {
      timestamps: true,
    }
  );


  export const User = mongoose.model<IUser>("User", userSchema);