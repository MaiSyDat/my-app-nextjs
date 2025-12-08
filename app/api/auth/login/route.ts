/**
 * API Route: Đăng nhập user
 * 
 * POST /api/auth/login
 * Body: { email, password }
 * 
 * Xử lý:
 * - Validate email và password
 * - Hash password và so sánh với database
 * - Trả về user info (không bao gồm password)
 * - Lưu user vào localStorage ở client
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import User from "@/app/models/User";
import { createHash } from "crypto";

// Hàm hash mật khẩu sử dụng SHA-256
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// API route handler xử lý đăng nhập
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation các trường bắt buộc
    if (!email || !password) {
      return NextResponse.json(
        { message: "Please fill in all fields." },
        { status: 400 }
      );
    }

    // Kết nối database
    await dbConnect();

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Hash password và so sánh
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Tạo session token đơn giản (có thể dùng JWT sau)
    const sessionToken = Buffer.from(`${user._id}:${Date.now()}`).toString("base64");

    // Trả về response thành công với user info và token
    return NextResponse.json(
      {
        message: "Login successful!",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        token: sessionToken,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

