/**
 * API Route: Đánh dấu tin nhắn đã đọc
 * 
 * PUT /api/messengers/read
 * Body: { messageIds: string[], userId: string }
 * 
 * Xử lý:
 * - Cập nhật isRead = true cho các tin nhắn
 * - Chỉ cập nhật tin nhắn mà user này là người nhận
 * - Chỉ cập nhật tin nhắn chưa đọc (isRead = false)
 * - Set readAt timestamp
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import Messenger from "@/app/models/Messenger";
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { messageIds, userId } = body;

    // Validation
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { message: "messageIds array is required." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ message: "userId is required." }, { status: 400 });
    }

    // Cập nhật trạng thái đã đọc cho các tin nhắn mà user này là người nhận
    const result = await Messenger.updateMany(
      {
        _id: { $in: messageIds },
        receiverId: userId,
        isRead: false, // Chỉ cập nhật tin nhắn chưa đọc
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        message: "Messages marked as read.",
        updatedCount: result.modifiedCount,
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

