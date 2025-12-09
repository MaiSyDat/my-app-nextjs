/**
 * API Route: Lấy danh sách tất cả users đã từng nhắn tin với current user
 * 
 * GET /api/messengers/conversations?userId={id}
 * - Lấy tất cả users đã từng gửi hoặc nhận tin nhắn với current user
 * - Trả về danh sách unique users với thông tin đầy đủ
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import Messenger from "@/app/models/Messenger";
import mongoose from "mongoose";
import { normalizeObjectId } from "@/app/lib/utils/serverApiUtils";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required." },
        { status: 400 }
      );
    }

    // Validate và convert ObjectId
    const userIdObj = normalizeObjectId(userId);
    if (!userIdObj) {
      return NextResponse.json(
        { message: "Invalid userId format." },
        { status: 400 }
      );
    }

    // Sử dụng aggregation để lấy tất cả unique users đã từng nhắn tin
    const conversations = await Messenger.aggregate([
      {
        $match: {
          $or: [
            { senderId: userIdObj },
            { receiverId: userIdObj },
          ],
          isDeleted: false,
        },
      },
      {
        $project: {
          otherUserId: {
            $cond: [
              { $eq: ["$senderId", userIdObj] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessageAt: "$createdAt",
        },
      },
      {
        $group: {
          _id: "$otherUserId",
          lastMessageAt: { $max: "$lastMessageAt" },
        },
      },
      {
        $sort: { lastMessageAt: -1 }, // Sắp xếp theo tin nhắn mới nhất
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 0,
          id: { $toString: "$user._id" },
          username: "$user.username",
          email: "$user.email",
          displayName: "$user.displayName",
          avatar: "$user.avatar",
          lastMessageAt: 1,
        },
      },
    ]);

    return NextResponse.json(
      {
        conversations: conversations,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

