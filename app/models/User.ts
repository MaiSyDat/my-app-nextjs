/**
 * Mongoose Schema và Model cho User
 * 
 * Schema này định nghĩa:
 * - username: Tên người dùng (required, unique, index)
 * - email: Email (required, unique, index)
 * - password: Mật khẩu đã hash (required)
 * - Timestamps tự động (createdAt, updatedAt)
 */

import mongoose, { Document, Model, Schema} from "mongoose";

// Interface cho User document
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  displayName?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Định nghĩa schema cho User
const UserSchema: Schema<IUser> = new Schema({
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    avatar: { type: String, required: false },
    displayName: { type: String, required: false },
    phoneNumber: { type: String, required: false },
}, {
    timestamps: true,
    strict: true, // Chỉ lưu các trường được định nghĩa trong schema
})

// Xóa model cũ nếu có để đảm bảo schema mới được áp dụng
if (mongoose.models.User) {
  delete mongoose.models.User;
}

// Tạo model mới với schema đã cập nhật
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
