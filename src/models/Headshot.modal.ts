import mongoose, { Document, Schema } from 'mongoose';

export interface IHeadshot extends Document {
  userId: mongoose.Types.ObjectId;
  originalPhotoUrl: string; // S3 URL of the original uploaded photo
  originalPhotoKey: string; // S3 key for deletion
  status: 'processing' | 'completed' | 'failed';
  generatedHeadshots: Array<{
    style: string;
    url: string;
    key: string; // S3 key
    createdAt: Date;
  }>;
  selectedStyles: string[]; // Styles user selected for generation
  failureReason?: string;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const headshotSchema = new Schema<IHeadshot>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    originalPhotoUrl: {
      type: String,
      required: [true, 'Original photo URL is required'],
    },
    originalPhotoKey: {
      type: String,
      required: [true, 'Original photo S3 key is required'],
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
      index: true,
    },
    generatedHeadshots: [
      {
        style: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        key: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    selectedStyles: {
      type: [String],
      required: true,
      default: [],
    },
    failureReason: {
      type: String,
    },
    processingStartedAt: {
      type: Date,
    },
    processingCompletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
headshotSchema.index({ userId: 1, createdAt: -1 });
headshotSchema.index({ userId: 1, status: 1 });

export const Headshot = mongoose.model<IHeadshot>('Headshot', headshotSchema);
