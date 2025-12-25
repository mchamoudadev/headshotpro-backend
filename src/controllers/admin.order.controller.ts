import { orderService } from "@/services";
import { paymentService } from "@/services/payment";
import { createdResponse, successResponse } from "@/util/response";
import { Request, Response } from "express";

export const getAllOrders = async (req: Request, res: Response) => {

    const { limit = 10, page = 1, status, platform } = req.query;

    const orders = await orderService.getAllOrders(
        {
            limit: Number(limit),
            page: Number(page),
            status: status as string,
            platform: platform as string,
        }
    );
    return successResponse(res, "Orders fetched successfully", orders);
}

export const createManualOrder = async (req: Request, res: Response) => {
    const { userId, packageId, amount } = req.body;
    const order = await orderService.CreateManualOrder({ userId, packageId, amount });
    return createdResponse(res, "Manual order created successfully", order);
}

export const getPackages = async (req: Request, res: Response) => {
    const packages = await paymentService.getCreditPackages();
    return successResponse(res, "Packages fetched successfully", packages);
}