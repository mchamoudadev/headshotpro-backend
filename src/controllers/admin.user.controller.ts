import { userService } from "@/services/user";
import { AppError } from "@/util/errors";
import { successResponse } from "@/util/response";
import { Request, Response } from "express";

export const getAllUsers = async (req: Request, res: Response) => {
    const users = await userService.getAllUsers();
    return successResponse(res, "Users fetched successfully", users);
}


export const updateUserRole = async (req: Request, res: Response) => {
    const { userId, role } = req.body;
    if(!userId || !role){
        throw new AppError("User ID and role are required", 400, "USER_ID_AND_ROLE_REQUIRED");
    }
    const user = await userService.updateUserRole({ userId, role });
    return successResponse(res, "User role updated successfully", user);
}

export const deleteUser = async (req: Request, res: Response) => {
    const { userId } = req.params;
    if(!userId){    
        throw new AppError("User ID is required", 400, "USER_ID_REQUIRED");
    }
    await userService.deleteUser(userId);
    return successResponse(res, "User deleted successfully");
}

export const addCredits = async (req: Request, res: Response) => {
    const { userId, credits } = req.body;
    if(!userId || !credits){
        throw new AppError("User ID and credits are required", 400, "USER_ID_AND_CREDITS_REQUIRED");
    }
    const user = await userService.addCredits({ userId, credits });
    return successResponse(res, "Credits added successfully", user);
}