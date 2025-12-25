import { CreditPackage, IOrder, Order, User } from "@/models";
import { PaymentPlatform, PaymentStatus } from "@/types/payment-types";
import { AppError } from "@/util/errors";
import { logger } from "@/util/logger";

export class OrderService {

  async getAllOrders(params: {
    limit: number;
    page: number;
    status: string;
    platform: string;
  }): Promise<{
    orders: IOrder[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    try {
      const { limit, page, status, platform } = params;

      // query = { status: 'completed', platform: 'mobile' }

      //   100

      //  limit  = 10
      // skip = 20
      // page = 3

      const query: any = {};

      if (status) query.status = status;
      if (platform) query.platform = platform;

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate("user", "name email")
          .populate("package")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Order.countDocuments(query),
      ]);

      // Equivalent to

      //   const orders = await Order.find(query)
      //     .populate('user', 'name email')
      //     .populate('package')
      //     .sort({ createdAt: -1 })
      //     .skip(skip)
      //     .limit(limit)

      //     const total = await Order.countDocuments();

      // 1000/10 = 100 pages

      return {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
        logger.error(`Failed to get all orders`, error);
        throw new AppError("Failed to get all orders", 500, "FAILED_TO_GET_ALL_ORDERS");
    }
  }

  async CreateManualOrder(data: {
    userId: string;
    packageId: string;
    amount: number;
  }): Promise<IOrder> {


    try {
      const { userId, packageId, amount } = data;


         // Verify user exists
         const user = await User.findById(userId);
         if (!user) {
           throw new AppError('User not found', 404, 'USER_NOT_FOUND');
         }
   
         // Verify package exists
         const creditPackage = await CreditPackage.findById(packageId);
         if (!creditPackage) {
           throw new AppError('Package not found', 404, 'PACKAGE_NOT_FOUND');
         }


         // Create order


            // Create order marked as completed
      const order = await Order.create({
        user: userId,
        package: packageId,
        amount,
        credits: creditPackage.credits + (creditPackage.bonus || 0),
        platform: PaymentPlatform.LOCAL,
        phone: 'ADMIN', // Required for LOCAL platform, placeholder for admin-created orders
        status: PaymentStatus.COMPLETED,
        creditsAdded: true,
        transactionId: `MANUAL-${Date.now()}`,
      });

    //   add credits to user
    await User.findByIdAndUpdate(userId, {$inc: {credits : order.credits}})

    logger.info(`Manual order created successfully for user ${userId} with package ${packageId} and amount ${amount}`);

    return order;

    } catch (error) {
        logger.error(`Failed to create manual order`, error);
      throw new AppError("Failed to create manual order", 500, "FAILED_TO_CREATE_MANUAL_ORDER");
    }
  }
}

export const orderService = new OrderService();