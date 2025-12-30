import { CreditPackage, ICreditPackage, IOrder, Order, User } from "@/models";
import {
  MobileWalletConfig,
  MobileWalletPayload,
  MobileWalletResponse,
  PaymentPlatform,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
} from "@/types/payment-types";
import { AppError, NotFoundError } from "@/util/errors";
import { logger } from "@/util/logger";
import { stripeService } from "./stripe-service";
import { triggerCreditAddition } from "../queue/queue.service";
import { config } from "@/config";
import axios from "axios";
import { orderService } from "../orders/order.service";

export class PaymentService {
  // TO_DO: Implement the stripe service
  // private stripeService: StripeService;

  // get All Credit Packages

  async getCreditPackages(): Promise<ICreditPackage[]> {
    try {
      const creditPackages = await CreditPackage.find({ isActive: true });
      return creditPackages;
    } catch (error) {
      logger.error("Failed to get credit packages", error);
      throw new AppError("Failed to get credit packages");
    }
  }

  //   get credit package by id
  async getCreditPackageById(id: string): Promise<ICreditPackage> {
    try {
      const creditPackage = await CreditPackage.findById(id);
      if (!creditPackage) {
        throw new NotFoundError("Credit package not found");
      }
      return creditPackage;
    } catch (error) {
      logger.error("Failed to get credit package by id", error);
      throw new AppError("Failed to get credit package by id");
    }
  }

  //   create order

  async createOrder(params: {
    userId: string;
    packageId: string;
    amount: number;
    credits: number;
    platform: PaymentPlatform;
    phone?: string;
  }): Promise<IOrder> {
    try {
      const { userId, packageId, amount, credits, platform, phone } = params;

      const order = await Order.create({
        user: userId,
        package: packageId,
        amount,
        credits,
        platform,
        phone,
      });
      return order;
    } catch (error) {
      logger.error("Failed to create order", error);
      throw new AppError("Failed to create order");
    }
  }

  // process payment for stripe

  async processStripePayment(params: {
    order: IOrder;
    creditPackage: ICreditPackage;
    totalCredits: number;
    successUrl: string;
    cancelUrl: string;
    userEmail?: string;
  }): Promise<PaymentResponse> {
    try {
      const {
        order,
        creditPackage,
        totalCredits,
        successUrl,
        cancelUrl,
        userEmail,
      } = params;

      // create stripe checkout session
      const stripeSession = await stripeService.createCheckoutSession({
        userId: order.user.toString(),
        packageId: order.package.toString(),
        amount: order.amount,
        credits: totalCredits,
        successUrl,
        cancelUrl,
        customerEmail: userEmail,
        metadata: {
          orderId: order._id.toString(),
          packageName: creditPackage.name,
        },
      });

      // update order with stripe session id
      order.stripeSessionId = stripeSession.sessionId;
      order.status = PaymentStatus.PROCESSING;
      await order.save();

      await orderService.invalidateOrdersCache();

      logger.info(
        `Stripe checkout session created successfully for order ${order._id.toString()}`
      );

      return {
        success: true,
        message: "Payment session created successfully",
        orderId: order._id.toString(),
        sessionId: stripeSession.sessionId,
        redirectUrl: stripeSession.redirectUrl,
        cancelUrl: `${config.frontendUrl}/dashboard/user/credits?status=cancel`,
        amount: order.amount,
        credits: totalCredits,
        status: PaymentStatus.PROCESSING,
      };
    } catch (error: any) {
      const errorMessage =
        error instanceof AppError
          ? error.message
          : error?.message || error?.type || String(error) || "Unknown error";

      logger.error("Error processing Stripe payment", {
        error: errorMessage,
        stack: error.stack,
        orderId: params.order._id,
        stripeError: error?.type || error?.code,
        fullError: error,
      });

      throw new AppError(
        `Failed to process Stripe payment: ${errorMessage}`,
        500,
        "PROCESS_STRIPE_PAYMENT_ERROR"
      );
    }
  }

  // process payment

  async processPayment(params: {
    userId: string;
    packageId: string;
    platform: PaymentPlatform;
    phone?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<PaymentResponse> {
    try {
      const { userId, packageId, platform, phone, successUrl, cancelUrl } =
        params;
      logger.info(
        `Processing payment for user ${userId} with package ${packageId} on platform ${platform}`
      );

      // get the credit package
      const creditPackage = await this.getCreditPackageById(packageId);

      // calculate the amount
      const totalCredits = creditPackage.credits + (creditPackage.bonus || 0);

      // Get user Info from the database
      const user = await User.findById(userId).select("email");

      const userEmail = user?.email;

      const order = await this.createOrder({
        userId,
        packageId,
        amount: creditPackage.price,
        credits: totalCredits,
        platform,
        phone,
      });

      //   Process Payment based on the platform

      if (platform === PaymentPlatform.STRIPE) {
        return await this.processStripePayment({
          order,
          creditPackage,
          totalCredits,
          successUrl,
          cancelUrl,
          userEmail,
        });
      } else if (platform === PaymentPlatform.LOCAL) {
        // TO_DO: Implement the payment processing for the other platforms
        return {
          success: true,
          message: "Payment session created successfully",
          orderId: order._id.toString(),
          sessionId: undefined,
          redirectUrl: undefined,
          amount: order.amount,
          credits: totalCredits,
          status: PaymentStatus.PROCESSING,
        };
      } else if (
        platform === PaymentPlatform.EVC ||
        platform === PaymentPlatform.ZAAD ||
        platform === PaymentPlatform.SAHAL
      ) {
        if (!phone) {
          throw new AppError(
            "Phone number is required",
            400,
            "PHONE_NUMBER_REQUIRED"
          );
        }
        return await this.processMobileWalletPayment({
          order,
          platform,
          phone,
        });
      } else if (platform === PaymentPlatform.EBIR) {
        // TO_DO: Implement the payment processing for the other platforms
        return {
          success: true,
          message: "Payment session created successfully",
          orderId: order._id.toString(),
          sessionId: undefined,
          redirectUrl: undefined,
          amount: order.amount,
          credits: totalCredits,
          status: PaymentStatus.PROCESSING,
        };
      } else {
        throw new AppError(
          "Unsupported payment platform",
          400,
          "UNSUPPORTED_PAYMENT_PLATFORM"
        );
      }
    } catch (error) {
      logger.error("Failed to process payment", error);
      throw new AppError("Failed to process payment");
    }
  }

  // Process mobile wallet payment

  async processMobileWalletPayment(params: {
    order: IOrder;
    platform: PaymentPlatform;
    phone: string;
  }): Promise<PaymentResponse> {
    try {
      const { order, platform, phone } = params;

      if (!phone) {
        throw new AppError(
          "Phone number is required",
          400,
          "PHONE_NUMBER_REQUIRED"
        );
      }

      logger.info(
        `Processing mobile wallet payment for order ${order._id.toString()} on platform ${platform} with phone ${phone}`
      );

      const config = await this.getMobileWalletConfig(platform);

      if (
        !config.merchantUid ||
        !config.apiKey ||
        !config.apiUserId ||
        !config.apiEndpoint
      ) {
        logger.error(
          `Mobile wallet configuration is not valid for platform ${platform}`
        );
        throw new AppError(
          "Mobile wallet configuration is not valid",
          400,
          "INVALID_MOBILE_WALLET_CONFIGURATION"
        );
      }

      const payload: MobileWalletPayload = {
        schemaVersion: "1.0",
        requestId: order._id.toString() + Date.now().toString(),
        timestamp: Date.now(),
        channelName: "WEB",
        serviceName: "API_PURCHASE",
        serviceParams: {
          merchantUid: config.merchantUid,
          paymentMethod: "MWALLET_ACCOUNT",
          apiKey: config.apiKey,
          apiUserId: config.apiUserId,
          payerInfo: {
            accountNo: phone,
          },
          transactionInfo: {
            invoiceId: order._id.toString(),
            referenceId: order._id.toString(),
            amount: order.amount,
            currency: "USD",
            description: `Headshot Pro - ${order.credits} credits`,
            platform,
          },
        },
      };

      logger.info(
        `sending mobile wallet payload to the service ${config.apiEndpoint}`
      );

      const response = await axios.post<MobileWalletResponse>(
        config.apiEndpoint,
        payload
      );
      logger.info(`Mobile wallet response: ${JSON.stringify(response.data)}`);

      // handle payment response
      return await this.handleMobileWalletResponse(
        response.data,
        order,
        platform
      );
    } catch (error) {
      logger.error(
        `Failed to process mobile wallet payment on platform ${params?.platform}`,
        error
      );
      throw new AppError(
        "Failed to process mobile wallet payment",
        500,
        "FAILED_TO_PROCESS_MOBILE_WALLET_PAYMENT"
      );
    }
  }

  async handleMobileWalletResponse(
    response: MobileWalletResponse,
    order: IOrder,
    platform: PaymentPlatform
  ): Promise<PaymentResponse> {
    try {
      const isSuccess =
        response.responseCode === "2001" ||
        response.responseMsg === "RCS_SUCCESS";

      if (isSuccess) {
        // update order status

        console.log("response data", response);

        order.status = PaymentStatus.PROCESSING;
        order.transactionId = response.transactionId || response.referenceId;
        await order.save();

        // Queue credit addition
        await this.handlePaymentSuccess(order._id.toString(), "LOCAL");

        logger.info(
          `Mobile wallet payment processed successfully for order ${order._id.toString()} on platform ${platform}`
        );

        return {
          success: true,
          message: "Mobile wallet payment processed successfully",
          orderId: order._id.toString(),
          transactionId: order.transactionId,
          amount: order.amount,
          credits: order.credits,
          status: PaymentStatus.COMPLETED,
        };
      } else {
        // update order status

        order.status = PaymentStatus.FAILED;
        await order.save();

        logger.error(
          `Mobile wallet payment failed for order ${order._id.toString()} on platform ${platform}`
        );

        return {
          success: false,
          message: "Mobile wallet payment failed",
          orderId: order._id.toString(),
          transactionId: order.transactionId,
          amount: order.amount,
          error: {
            code: response.responseCode,
            message: response.responseMsg,
          },
        };
      }
    } catch (error) {
      logger.error(
        `Failed to handle mobile wallet response for order ${order._id.toString()} on platform ${platform}`,
        error
      );
      throw new AppError(
        "Failed to handle mobile wallet response",
        500,
        "FAILED_TO_HANDLE_MOBILE_WALLET_RESPONSE"
      );
    }
  }

  async getMobileWalletConfig(
    platform: PaymentPlatform
  ): Promise<MobileWalletConfig> {
    if (platform === PaymentPlatform.EBIR) {
      return {
        merchantUid: config.ebir.merchantUid,
        apiKey: config.ebir.apiKey,
        apiUserId: config.ebir.apiUserId,
        apiEndpoint: config.ebir.apiEndpoint,
      };
    }

    // EVC, ZAAD, SAHAL use the same configuration
    return {
      merchantUid: config.mobileWallet.merchantUid,
      apiKey: config.mobileWallet.apiKey,
      apiUserId: config.mobileWallet.apiUserId,
      apiEndpoint: config.mobileWallet.apiEndpoint,
    };
  }

  async handlePaymentSuccess(
    orderId: string,
    source: "STRIPE" | "LOCAL" | "ADMIN" = "STRIPE"
  ): Promise<void> {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        logger.warn(`Order not found for order id: ${orderId}`);
        throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
      }

      if (order.creditsAdded) {
        logger.warn(`Credits already added for order ${orderId}`);
        throw new AppError(
          "Credits already added for order",
          400,
          "CREDITS_ALREADY_ADDED"
        );
      }

      // Integrate Queue for the payment
      await triggerCreditAddition({
        orderId: order._id.toString(),
        userId: order.user.toString(),
        credits: order.credits,
        source: source,
      });

      logger.info(
        `Credit addition triggered for order ${orderId} with ${order.credits} credits from ${source}`
      );
    } catch (error) {
      logger.error(
        `Failed to handle payment success for order ${orderId} with credits from ${source}`,
        error
      );
      throw new AppError(
        "Failed to handle payment success for order",
        500,
        "FAILED_TO_HANDLE_PAYMENT_SUCCESS_FOR_ORDER"
      );
    }
  }
  // get payment history

  async getPaymentHistory(params: {userId: string, limit: number}): Promise<IOrder[]> {

    try {
      const orders = await Order.find({ user: params.userId })
      .populate("package")
      .sort({ createdAt: -1 })
      .limit(params.limit);

      logger.info(`Payment history fetched successfully for user ${params.userId} with ${orders.length} orders`);

      return orders;

    } catch (error) {
      logger.error(`Failed to get payment history for user ${params.userId}`, error);
      throw new AppError("Failed to get payment history", 500, "INTERNAL_SERVER_ERROR");
    }

  }

}

export const paymentService = new PaymentService();
