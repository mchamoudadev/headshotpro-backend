import mongoose, { Document, Schema } from 'mongoose';
import { PaymentPlatform, PaymentStatus } from '@/types/payment-types';

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  package: mongoose.Types.ObjectId;
  amount: number;
  credits: number;
  platform: PaymentPlatform;
  phone?: string;
  status: PaymentStatus;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  transactionId?: string;
  paymentDetails?: any;
  creditsAdded?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  package: { 
    type: Schema.Types.ObjectId, 
    ref: 'CreditPackage', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0 
  },
  credits: { 
    type: Number, 
    required: true,
    min: 0 
  },
  platform: { 
    type: String, 
    enum: Object.values(PaymentPlatform), 
    required: true 
  },
  phone: { 
    type: String,
    required: function(this: IOrder) {
      return this.platform === PaymentPlatform.LOCAL;
    }
  },
  status: { 
    type: String, 
    enum: Object.values(PaymentStatus), 
    default: PaymentStatus.PENDING,
    index: true 
  },
  stripeSessionId: { 
    type: String,
    sparse: true,
    index: true 
  },
  stripePaymentIntentId: { 
    type: String,
    sparse: true,
    index: true 
  },
  transactionId: { 
    type: String,
    sparse: true,
    index: true 
  },
  paymentDetails: { 
    type: Schema.Types.Mixed 
  },
  creditsAdded: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, creditsAdded: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
