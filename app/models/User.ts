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
  createdAt: Date;
  updatedAt: Date;
}

// Định nghĩa schema cho User
const UserSchema: Schema<IUser> = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, {
    timestamps: true,
})

// Tránh tạo lại model nếu đã được tạo
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
