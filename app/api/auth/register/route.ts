/**
 * API Route: Đăng ký user mới
 * 
 * POST /api/auth/register
 * Body: { username, email, password }
 * 
 * Xử lý:
 * - Validate username, email, password
 * - Kiểm tra email đã tồn tại chưa
 * - Hash password bằng SHA-256
 * - Tạo user mới trong database
 * - Trả về user info (không bao gồm password)
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import User from "@/app/models/User";
import { createHash } from "crypto";

// Hàm hash mật khẩu sử dụng SHA-256
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// API route handler xử lý đăng ký user mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validation các trường bắt buộc
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Please fill in all fields." },
        { status: 400 }
      );
    }

    // Validation định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format." },
        { status: 400 }
      );
    }

    // Validation độ dài password
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Validation độ dài username
    if (username.length < 3) {
      return NextResponse.json(
        { message: "Username must be at least 3 characters." },
        { status: 400 }
      );
    }

    // Kết nối database
    await dbConnect();

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "This email is already in use." },
        { status: 400 }
      );
    }

    // Kiểm tra username đã tồn tại chưa
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { message: "This username is already taken." },
        { status: 400 }
      );
    }

    // Hash password và tạo user mới
    const hashedPassword = hashPassword(password);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Trả về response thành công (không bao gồm password)
    return NextResponse.json(
      {
        message: "Registration successful!",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Xử lý lỗi duplicate key từ MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        {
          message:
            field === "email"
              ? "This email is already in use."
              : "This username is already taken.",
        },
        { status: 400 }
      );
    }

    // Xử lý các lỗi khác
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
