import { config } from "@/config";
import { Order } from "@/models";
import { PaymentStatus, StripePaymentResponse } from "@/types/payment-types";
import { AppError } from "@/util/errors";
import { logger } from "@/util/logger";
import Stripe from "stripe";
import { paymentService } from "./payment.service";

export class StripeService {
  private stripe: Stripe;

  constructor() {
    const stripeSecretKey = config.stripe.secretKey;

    if (!stripeSecretKey) {
      logger.error("Stripe secret key is not configured");
      throw new AppError("Stripe secret key is not configured");
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-12-15.clover",
    });
  }

  async createCheckoutSession(params: {
    userId: string;
    packageId: string;
    amount: number;
    credits: number;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, any>;
  }): Promise<StripePaymentResponse> {
    try {
      const {
        userId,
        packageId,
        amount,
        credits,
        successUrl,
        cancelUrl,
        customerEmail,
        metadata,
      } = params;

      // Create session config

      const sessionConfig: any = {
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${credits} Headshott credits`,
                description: `Purchase ${credits} credits for $${amount}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          packageId,
          credits: credits.toString(),
          ...metadata,
        },
      };

      // Pre-fill customer email if provided

      if (customerEmail) {
        sessionConfig.customer_email = customerEmail;
      }

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create(sessionConfig);

      logger.info(
        `Stripe checkout session created successfully for user ${userId} and package ${packageId}`
      );

      return {
        status: "success",
        sessionId: session.id,
        redirectUrl: session.url || undefined,
      };
    } catch (error) {
      logger.error(`Error creating Stripe checkout session: ${error}`);
      throw new AppError("Failed to create checkout session", 500);
    }
  }

  async handleStripeWebhook(
    rawBody: string | Buffer,
    signature: string
  ): Promise<any> {
    try {
      const webhookSecret = config.stripe.webhookSecret;

      if (!webhookSecret) {
        logger.error("Stripe webhook secret is not configured");
        throw new AppError(
          "Stripe webhook secret is not configured",
          500,
          "STRIPE_WEBHOOK_SECRET_REQUIRED"
        );
      }

      const event = await this.stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret
      );

      logger.info(`Stripe webhook event received: ${event.type}`);

      // handle the different types of events

      switch (event.type) {
        case "checkout.session.completed":
          logger.info(
            `Stripe checkout session completed for order ${event.data.object.metadata?.orderId}`
          );
          // TODO : update the order status to completed
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        case "payment_intent.payment_failed":
          logger.info(
            `Stripe payment intent failed for order ${event.data.object.metadata?.orderId}`
          );
          // TODO : update the order status to failed
          break;
        default:
          logger.warn(
            `Stripe webhook event received: ${event.type} is not supported`,
            {
              eventType: event.type,
              eventData: event.data.object,
            }
          );
          break;
      }
    } catch (error) {
      logger.error(`Error handling Stripe webhook: ${error}`);
      throw new AppError(
        "Failed to handle webhook",
        500,
        "HANDLE_STRIPE_WEBHOOK_ERROR"
      );
    }
  }

  private async handleCheckoutSessionCompleted(session: any): Promise<void> {
    try {
      // find order by session id

      let order = await Order.findOne({ stripeSessionId: session.id });

      if (!order && session.metadata?.orderId) {
        logger.warn(`Order not found for stripe session id: ${session.id}`);
        order = await Order.findById(session.metadata?.orderId);
      }

      if (!order) {
        logger.warn(`Order not found for stripe session id: ${session.id}`);
        return;
      }

      // update order status to completed with payment details

      if (session.payment_intent && !order.stripePaymentIntentId) {
        order.stripePaymentIntentId = session.payment_intent;
      }

      if (!order.stripeSessionId) {
        order.stripeSessionId = session.id;
      }

      await order.save();

      // check paymnet status and process if paid

      if (
        session.payment_status === "paid" &&
        order.status !== PaymentStatus.COMPLETED
      ) {
        // process the payment for all types of payments

        await paymentService.handlePaymentSuccess(order._id.toString(), "STRIPE");
        logger.info(`Payment processed successfully for order ${order._id.toString()}`);
      }else{
        logger.warn(`Payment not processed for order ${order._id.toString()} because payment status is not paid or order status is completed`);
      }
    } catch (error) {
      logger.error(`Error handling Stripe checkout session completed: ${error}`);
      throw new AppError("Failed to handle checkout session completed", 500, "HANDLE_STRIPE_CHECKOUT_SESSION_COMPLETED_ERROR");
    }
  }
}

export const stripeService = new StripeService();
