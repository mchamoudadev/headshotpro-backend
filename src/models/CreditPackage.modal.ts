import mongoose, { Document, Schema } from 'mongoose';

export interface ICreditPackage extends Document {
  name: string;
  credits: number;
  price: number;
  description?: string;
  isActive: boolean;
  stripePriceId?: string;
  bonus?: number; // Extra credits for this package
  popular?: boolean; // Mark as popular for UI
  createdAt: Date;
  updatedAt: Date;
}

const creditPackageSchema = new Schema<ICreditPackage>({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  credits: { 
    type: Number, 
    required: true,
    min: 1 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  description: { 
    type: String,
    trim: true 
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true 
  },
  stripePriceId: { 
    type: String,
    unique: true,
    sparse: true 
  },
  bonus: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  popular: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

// Index for efficient queries
creditPackageSchema.index({ isActive: 1, price: 1 });

export const CreditPackage = mongoose.model<ICreditPackage>('CreditPackage', creditPackageSchema);
