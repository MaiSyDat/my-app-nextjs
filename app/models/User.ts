import mongoose, { Document, Model, Schema} from "mongoose";
import { use } from "react";

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
