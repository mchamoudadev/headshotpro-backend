import { IUser, User, UserRole } from "@/models/User.model";
import { AppError, NotFoundError } from "@/util/errors";

export class UserService {
  async getAllUsers(): Promise<{ users: IUser[]; total: number }> {
    try {
      const users = await User.find()
        .select(
          "-password -refreshToken -emailVerificationToken -emailVerificationExpires"
        )
        .sort({ createdAt: -1 });

      const total = await User.countDocuments();
      return { users, total };
    } catch (error) {
      throw new AppError("Failed to fetch users", 500, "FAILED_TO_FETCH_USERS");
    }
  }

  async updateUserRole(data: {
    userId: string;
    role: UserRole;
  }): Promise<IUser> {
    try {
      const { userId, role } = data;

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      ).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpires"
      );

      if (!user) {
        throw new NotFoundError("User not found");
      }

      return user;
    } catch (error) {
      throw new AppError(
        "Failed to update user role",
        500,
        "FAILED_TO_UPDATE_USER_ROLE"
      );
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await User.findByIdAndDelete(userId);
    } catch (error) {
      throw new AppError("Failed to delete user", 500, "FAILED_TO_DELETE_USER");
    }
  }

  async addCredits(data: { userId: string; credits: number }): Promise<IUser> {
    try {
      const { userId, credits } = data;

      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { credits } },
        { new: true }
      ).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpires"
      );

      if (!user) {
        throw new NotFoundError("User not found");
      }

      return user;
    } catch (error: any) {
      throw new AppError(
        "Failed to add credits",
        500,
        "FAILED_TO_ADD_CREDITS",
        error.message || "INTERNAL_SERVER_ERROR"
      );
    }
  }
}

export const userService = new UserService();