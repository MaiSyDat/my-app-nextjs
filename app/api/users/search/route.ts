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
import Friendship from "@/app/models/Friendship";
import mongoose from "mongoose";

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

    if (!currentUserId) {
      return NextResponse.json(
        { message: "currentUserId is required." },
        { status: 400 }
      );
    }

    const currentUserIdObj = new mongoose.Types.ObjectId(currentUserId);

    // Tìm kiếm user theo username hoặc email (không phân biệt hoa thường)
    const searchRegex = new RegExp(query.trim(), "i");
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { email: searchRegex },
      ],
      // Loại trừ user hiện tại
      _id: { $ne: currentUserIdObj },
    })
      .select("username email _id")
      .limit(10);

    // Lấy danh sách user IDs đã bị chặn hoặc đã chặn currentUser
    const blockedFriendships = await Friendship.find({
      $or: [
        { userId1: currentUserIdObj, status: "blocked" },
        { userId2: currentUserIdObj, status: "blocked" },
      ],
    });

    // Tạo set các user IDs bị chặn
    const blockedUserIds = new Set<string>();
    blockedFriendships.forEach((friendship) => {
      const userId1Str = friendship.userId1.toString();
      const userId2Str = friendship.userId2.toString();
      if (userId1Str === currentUserId) {
        blockedUserIds.add(userId2Str);
      } else {
        blockedUserIds.add(userId1Str);
      }
    });

    // Lọc bỏ những user đã bị chặn
    const filteredUsers = users.filter(
      (user) => !blockedUserIds.has(user._id.toString())
    );

    // Lấy thông tin friendship status cho từng user
    const userIds = filteredUsers.map((user) => user._id);
    const friendships = await Friendship.find({
      $or: [
        { userId1: currentUserIdObj, userId2: { $in: userIds } },
        { userId2: currentUserIdObj, userId1: { $in: userIds } },
      ],
    });

    // Tạo map friendship status
    const friendshipMap = new Map<string, { status: string; requestedBy: string }>();
    friendships.forEach((friendship) => {
      const userId1Str = friendship.userId1.toString();
      const userId2Str = friendship.userId2.toString();
      const otherUserId = userId1Str === currentUserId ? userId2Str : userId1Str;
      friendshipMap.set(otherUserId, {
        status: friendship.status,
        requestedBy: friendship.requestedBy.toString(),
      });
    });

    // Format kết quả với friendship status
    const result = filteredUsers.map((user) => {
      const userIdStr = user._id.toString();
      const friendship = friendshipMap.get(userIdStr);
      
      return {
        id: userIdStr,
        username: user.username,
        email: user.email,
        friendshipStatus: friendship?.status || null,
        requestedBy: friendship?.requestedBy || null,
      };
    });

    return NextResponse.json(
      {
        users: result,
        total: result.length,
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

