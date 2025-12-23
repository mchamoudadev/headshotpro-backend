import { paymentService, PaymentService, stripeService } from "@/services/payment";
import { AppError, NotFoundError } from "@/util/errors";
import { logger } from "@/util/logger";
import { errorResponse, successResponse } from "@/util/response";
import e, { Request, Response } from "express";

export const getCreditPackages = async (req: Request, res: Response) => {

    // call the service to get the credit packages
    const creditPackages = await paymentService.getCreditPackages();
    // send the response
   return successResponse(res, "Credit packages fetched successfully", creditPackages);
}


export const processPayment = async (req: Request, res: Response) => {

    // paymnet service to process the payment

    const userId = req.user?.userId;
    logger.info(`Processing payment for user ${userId}`);
    if(!userId) {
        throw new NotFoundError("User not found");
    }

    const { packageId, platform, phone, successUrl, cancelUrl } = req.body;

    // pass the parameters to the service

    const paymentResponse = await paymentService.processPayment({ userId, packageId, platform, phone, successUrl, cancelUrl });

    if(!paymentResponse.success) {
        return errorResponse(res, paymentResponse.message);
    }

    return successResponse(res, paymentResponse.message, paymentResponse);
}



export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    throw new AppError('Missing stripe-signature header', 400, 'STRIPE_SIGNATURE_MISSING');
  }

  await stripeService.handleStripeWebhook(req.body, signature);

  res.status(200).json({ received: true });
};


export const getPaymentHistory = async (req: Request, res: Response) => {

    const userId = req.user?.userId;
    const { limit } = req.query || 10;
    if(!userId) {
        logger.error("User not found");
        throw new NotFoundError("User not found");
    }

    // call the service to get the payment history
    const paymentHistory = await paymentService.getPaymentHistory({ userId, limit: Number(limit) });

    return successResponse(res, "Payment history fetched successfully", paymentHistory);

}