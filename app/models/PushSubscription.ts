/**
 * Mongoose Schema và Model cho Push Subscription
 * 
 * Schema này lưu trữ:
 * - userId: ID của user (ref User)
 * - endpoint: Push service endpoint URL
 * - keys: Object chứa p256dh và auth keys
 * - createdAt, updatedAt: Timestamps
 * - Index trên userId để query nhanh
 */

import mongoose, { Document, Model, Schema } from "mongoose";

// Interface cho PushSubscription document
export interface IPushSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Định nghĩa schema
const PushSubscriptionSchema: Schema<IPushSubscription> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true, // Mỗi endpoint chỉ có một subscription
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index để query nhanh
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 });

// Tránh tạo lại model nếu đã được tạo
const PushSubscription: Model<IPushSubscription> =
  mongoose.models.PushSubscription || mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;

