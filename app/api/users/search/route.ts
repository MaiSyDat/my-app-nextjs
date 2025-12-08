/**
 * API Route: Tìm kiếm user
 * 
 * GET /api/users/search?q={query}
 * 
 * Tìm kiếm users theo:
 * - Username (case-insensitive, partial match)
 * - Email (case-insensitive, partial match)
 * - Sử dụng MongoDB regex để search
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import User from "@/app/models/User";
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const currentUserId = searchParams.get("currentUserId");

    // Validation
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { message: "Search query is required." },
        { status: 400 }
      );
    }

    // Tìm kiếm user theo username hoặc email (không phân biệt hoa thường)
    const searchRegex = new RegExp(query.trim(), "i");
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { email: searchRegex },
      ],
      // Loại trừ user hiện tại
      _id: currentUserId ? { $ne: currentUserId } : undefined,
    })
      .select("username email _id") // Chỉ lấy các trường cần thiết
      .limit(10); // Giới hạn 10 kết quả

    return NextResponse.json(
      {
        users: users.map((user) => ({
          id: user._id,
          username: user.username,
          email: user.email,
        })),
        total: users.length,
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

