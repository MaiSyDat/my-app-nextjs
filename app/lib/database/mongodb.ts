/**
 * MongoDB Connection Utility
 * 
 * File này xử lý:
 * - Kết nối đến MongoDB database
 * - Cache connection để tránh tạo nhiều connections
 * - Import tất cả models để đảm bảo được đăng ký
 * - Reuse connection trong môi trường development
 */

import mongoose from "mongoose";
// Import tất cả models để đảm bảo chúng được đăng ký trước khi sử dụng
import "@/app/models";

// Lấy URI từ biến môi trường
const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// cached connection để tranh việc tạo nhiều kết nối trong môi trường phát triển
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

// Hàm kết nối đến MongoDB
async function dbConnect() {
  // Nếu đã kết nối cachedd, dùng lại kết nối đó
  if (cached.conn) {
    return cached.conn;
  }

  // Nếu chưa có promise cachedd, tạo mới
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
  }

  //Chờ promise hoàn thành và lưu kết nối vào cached
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;

