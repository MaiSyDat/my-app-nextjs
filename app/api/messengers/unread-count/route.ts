/**
 * API Route: Lấy số tin nhắn chưa đọc cho từng user
 * 
 * GET /api/messengers/unread-count?receiverId={userId}
 * 
 * Trả về object với key là senderId và value là số tin nhắn chưa đọc
 * Sử dụng MongoDB Aggregation Pipeline để đếm hiệu quả
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import Messenger from "@/app/models/Messenger";
import mongoose from "mongoose";

// GET: Lấy số tin nhắn chưa đọc cho mỗi user (group by senderId)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const receiverId = searchParams.get("receiverId");

    if (!receiverId) {
      return NextResponse.json(
        { message: "receiverId is required." },
        { status: 400 }
      );
    }

    // Aggregate để đếm số tin nhắn chưa đọc theo từng senderId
    const unreadCounts = await Messenger.aggregate([
      {
        $match: {
          receiverId: new mongoose.Types.ObjectId(receiverId),
          isRead: false,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          senderId: { $toString: "$_id" },
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Convert thành object { senderId: count }
    const result: { [key: string]: number } = {};
    unreadCounts.forEach((item) => {
      result[item.senderId] = item.count;
    });

    return NextResponse.json(
      {
        unreadCounts: result,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=30', // Cache 30 giây cho unread counts
        }
      }
    );
  } catch (error: any) {
    console.error("[API] Error fetching unread counts:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

