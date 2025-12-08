/**
 * Mongoose Schema và Model cho Messenger (Tin nhắn)
 * 
 * Schema này định nghĩa:
 * - senderId, receiverId: ID người gửi và nhận (required, ref User)
 * - content: Nội dung tin nhắn (required)
 * - messageType: Loại tin nhắn (text, image, file, video, audio, system)
 * - isRead: Trạng thái đã đọc (default: false, index)
 * - readAt: Thời gian đọc (sparse: true)
 * - isDeleted: Soft delete flag (default: false, index)
 * - deletedAt: Thời gian xóa (sparse: true)
 * - fileUrl, fileName, fileSize: Thông tin file (sparse: true)
 * - replyTo: ID tin nhắn được reply (sparse: true)
 * - reactions: Array reactions (default: undefined)
 * - Compound indexes để query nhanh
 * - Pre-save/pre-update hooks để loại bỏ null/undefined fields
 */

import mongoose, { Document, Model, Schema } from "mongoose";

// Interface cho Messenger document
export interface IMessenger extends Document {
  // ID người gửi tin nhắn
  senderId: mongoose.Types.ObjectId;
  
  // ID người nhận tin nhắn
  receiverId: mongoose.Types.ObjectId;
  
  // Nội dung tin nhắn
  content: string;
  
  // Loại tin nhắn: text, image, file, video, audio, system
  messageType: "text" | "image" | "file" | "video" | "audio" | "system";
  
  // URL file nếu là image/file/video/audio
  fileUrl?: string;
  
  // Tên file gốc
  fileName?: string;
  
  // Kích thước file (bytes)
  fileSize?: number;
  
  // Tin nhắn được reply (ID của tin nhắn gốc)
  replyTo?: mongoose.Types.ObjectId;
  
  // Trạng thái đã đọc chưa
  isRead: boolean;
  
  // Thời gian đọc (nếu đã đọc)
  readAt?: Date;
  
  // Reactions (emoji reactions)
  reactions?: Array<{
    emoji: string;
    userId: mongoose.Types.ObjectId;
  }>;
  
  // Tin nhắn đã bị xóa chưa (soft delete)
  isDeleted: boolean;
  
  // Thời gian xóa (nếu đã xóa)
  deletedAt?: Date;
  
  // Timestamps tự động
  createdAt: Date;
  updatedAt: Date;
}

// Định nghĩa schema cho Messenger
const MessengerSchema: Schema<IMessenger> = new Schema(
  {
    // ID người gửi - tham chiếu đến User
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index để query nhanh
    },
    
    // ID người nhận - tham chiếu đến User
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index để query nhanh
    },
    
    // Nội dung tin nhắn
    content: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Loại tin nhắn
    messageType: {
      type: String,
      enum: ["text", "image", "file", "video", "audio", "system"],
      default: "text",
    },
    
    // URL file (nếu có) - sparse: true để không lưu null
    fileUrl: {
      type: String,
      sparse: true, // Chỉ lưu khi có giá trị
    },
    
    // Tên file gốc - sparse: true để không lưu null
    fileName: {
      type: String,
      sparse: true, // Chỉ lưu khi có giá trị
    },
    
    // Kích thước file (bytes) - sparse: true để không lưu null
    fileSize: {
      type: Number,
      sparse: true, // Chỉ lưu khi có giá trị
    },
    
    // Tin nhắn được reply - sparse: true để không lưu null
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Messenger",
      sparse: true, // Chỉ lưu khi có giá trị
    },
    
    // Trạng thái đã đọc
    isRead: {
      type: Boolean,
      default: false,
      index: true, // Index để query tin nhắn chưa đọc
    },
    
    // Thời gian đọc - sparse: true để không lưu null
    readAt: {
      type: Date,
      sparse: true, // Chỉ lưu khi có giá trị
    },
    
    // Reactions (emoji reactions) - chỉ lưu khi có reactions
    reactions: {
      type: [
        {
          emoji: {
            type: String,
            required: true,
          },
          userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
        },
      ],
      default: undefined, // Không lưu array rỗng
    },
    
    // Tin nhắn đã bị xóa chưa (soft delete)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Thời gian xóa - sparse: true để không lưu null
    deletedAt: {
      type: Date,
      sparse: true, // Chỉ lưu khi có giá trị
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Compound index để query tin nhắn giữa 2 người nhanh hơn
MessengerSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessengerSchema.index({ receiverId: 1, senderId: 1, createdAt: -1 });
MessengerSchema.index({ isRead: 1, receiverId: 1 });

// Tránh tạo lại model nếu đã được tạo
const Messenger: Model<IMessenger> =
  mongoose.models.Messenger || mongoose.model<IMessenger>("Messenger", MessengerSchema);

export default Messenger;

