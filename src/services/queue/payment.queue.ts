import { Order, User } from "@/models";
import { PaymentStatus } from "@/types/payment-types";
import { logger } from "@/util/logger";
import { NonRetriableError } from "inngest";
import { emailService } from "../notification";
import { inngestClient } from "./inngest-clients";

export interface ICreditAdditionData {
  orderId: string;
  userId: string;
  credits: number;
  source: "STRIPE" | "LOCAL" | "ADMIN";
}

export function getCreditAdditionFunction() {
  return inngestClient.createFunction(
    { id: "payment-add-credits", name: "Payment Add Credits", retries: 3 },
    {
      event: "payment/credits-add",
    },
    async ({ event, step } : { event: any, step: any }) => {
      const { orderId, userId, credits, source } =
        event.data as ICreditAdditionData;

      logger.info(
        `Credit addition triggered for order ${orderId} with ${credits} credits from ${source}`
      );

      // step 1 : get the order

      const order = await step.run("validate-order", async () => {
        const foundOrder = await Order.findById(orderId);

        if (!foundOrder) {
          logger.warn(`Order not found for order id: ${orderId}`);
          throw new NonRetriableError("Order not found");
        }

        if (foundOrder.creditsAdded) {
          logger.warn(`Credits already added for order ${orderId}`);
          return { alredyProcessed: true, order: foundOrder };
        }

        return { alredyProcessed: false, order: foundOrder };
      });

      if (order.alredyProcessed) {
        logger.info(`Credits already added for order ${orderId}`);
        return {
          success: true,
          message: "Credits already added for order",
          skipped: true,
        };
      }

      // step 2 : add the credits to the user

      const result = await step.run("add-credits", async () => {
        // find the user
        const user = await User.findById(userId);

        if (!user) {
          logger.warn(`User not found for user id: ${userId}`);
          throw new NonRetriableError("User not found");
        }

        // get the order
        const updatedOrder = await Order.findById(orderId);

        if (!updatedOrder) {
          logger.warn(`Order not found for order id: ${orderId}`);
          throw new NonRetriableError("Order not found");
        }

        // update the order credits added
        updatedOrder.creditsAdded = true;
        await updatedOrder.save();
        // update the user credits

        const previousBalance = user.credits;
        user.credits += credits;
        await user.save();

        // Mark the order credits added and completed
        updatedOrder.creditsAdded = true;
        updatedOrder.status = PaymentStatus.COMPLETED;
        await updatedOrder.save();

        logger.info(
          `Credits added for order ${orderId} with ${credits} credits from ${source}`
        );

        return {
          success: true,
          previousBalance,
          newBalance: user.credits,
          creditsAdded: credits,
          skipped: false,
          userEmail: user.email,
          userName: user.name,
          orderAmount: updatedOrder.amount,
          orderId: updatedOrder._id.toString(),
        };
      });

      //   step 3 : send the email to the user

      await step.run("send-notification", async () => {
        try {
          // send the email to the user
          if (result.userEmail && result.orderAmount !== undefined) {
            await emailService.sendPaymentSuccessEmail(
              result.userEmail,
              result.userName,
              result.orderId,
              result.orderAmount,
              result.creditsAdded,
              result.newBalance
            );
            logger.info(
              `Email sent to ${result.userEmail} for order ${result.orderId}`
            );
          } else {
            logger.warn(
              `User email or order amount not found for order ${result.orderId}`
            );
            throw new NonRetriableError("User email or order amount not found");
          }
        } catch (error) {
          logger.error(
            `Failed to send email to ${result.userEmail} for order ${result.orderId}`,
            error
          );
          throw new NonRetriableError("Failed to send email");
        }

        return { notificationSent: true };
      });

      return {
        success: true,
        message: "Credits added for order",
        data: result,
      }
    }
  );
}
