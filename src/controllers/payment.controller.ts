import { paymentService, PaymentService, stripeService } from "@/services/payment";
import { AppError, NotFoundError } from "@/util/errors";
import { logger } from "@/util/logger";
import { errorResponse, successResponse } from "@/util/response";
import { Request, Response } from "express";


const courseInfo = [
    {
        id: 1,
        title: "Headshot Pro Build",
        description: "Learn how to build your own headshot pro build",
    },
    {
        id: 2,
        title: "HTML and CSS",
        description: "Learn how to build your own HTML and CSS",
    },
    {
        id: 3,
        title: "React",
        description: "Learn how to build your own React",
    },
]



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

    if(!userId) {
        logger.error("User not found");
        throw new NotFoundError("User not found");
    
    }

    const limit = req.query.limit as string || 10;

    // call the service to get the payment history


    const orders = await paymentService.getPaymentHistory({ userId, limit: Number(limit) });

    return successResponse(res, "Payment history fetched successfully", orders);

}


export const getCourseById = async (req: Request, res: Response) => {

    const { id } = req.params;

    const course = courseInfo.find((course) => course.id === Number(id));

    return successResponse(res, "Course fetched successfully", course);
}
