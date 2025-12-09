/**
 * Mongoose Schema và Model cho Friendship (Quan hệ bạn bè)
 * 
 * Schema này định nghĩa:
 * - userId1, userId2: ID của 2 users (required, ref User)
 * - status: Trạng thái (pending, accepted, blocked)
 * - requestedBy: ID người gửi lời mời (required, ref User)
 * - Compound indexes để query nhanh
 * - Unique constraint để tránh duplicate friendships
 */

import mongoose, { Document, Model, Schema } from "mongoose";

// Interface cho Friendship document
export interface IFriendship extends Document {
  // ID người dùng 1
  userId1: mongoose.Types.ObjectId;
  
  // ID người dùng 2
  userId2: mongoose.Types.ObjectId;
  
  // Trạng thái: pending (chờ chấp nhận), accepted (đã chấp nhận), blocked (đã chặn), unfriended (đã xóa bạn)
  status: "pending" | "accepted" | "blocked" | "unfriended";
  
  // Ai là người gửi lời mời kết bạn (userId1 hoặc userId2)
  requestedBy: mongoose.Types.ObjectId;
  
  // Thời gian chấp nhận lời mời
  acceptedAt?: Date;
  
  // Timestamps tự động
  createdAt: Date;
  updatedAt: Date;
}

// Định nghĩa schema cho Friendship
const FriendshipSchema: Schema<IFriendship> = new Schema(
  {
    // ID người dùng 1 - tham chiếu đến User
    userId1: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    // ID người dùng 2 - tham chiếu đến User
    userId2: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    // Trạng thái mối quan hệ
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked", "unfriended"],
      default: "pending",
      index: true,
    },
    
    // Ai là người gửi lời mời
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Thời gian chấp nhận
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Compound index để query bạn bè nhanh hơn
// Lưu ý: Cần đảm bảo userId1 < userId2 ở API level để tránh duplicate
FriendshipSchema.index({ userId1: 1, userId2: 1 }, { unique: true });
FriendshipSchema.index({ userId1: 1, status: 1 });
FriendshipSchema.index({ userId2: 1, status: 1 });

// Tránh tạo lại model nếu đã được tạo
const Friendship: Model<IFriendship> =
  mongoose.models.Friendship ||
  mongoose.model<IFriendship>("Friendship", FriendshipSchema);

export default Friendship;

