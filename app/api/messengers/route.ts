/**
 * API Route: Quản lý tin nhắn (Messengers)
 * 
 * GET /api/messengers?senderId={id}&receiverId={id}
 * - Lấy tất cả tin nhắn giữa 2 users
 * - Populate senderId để lấy thông tin người gửi
 * - Sắp xếp theo createdAt (mới nhất trước)
 * 
 * POST /api/messengers
 * - Tạo tin nhắn mới
 * - Validate senderId và receiverId
 * - Lưu vào database với isRead = false
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import Messenger from "@/app/models/Messenger";
import Friendship from "@/app/models/Friendship";
import User from "@/app/models/User"; // Import User model để đảm bảo được đăng ký trước khi populate
import { normalizeObjectId } from "@/app/lib/utils/serverApiUtils";

// GET: Lấy danh sách tin nhắn giữa 2 người
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Lấy query parameters
    const searchParams = request.nextUrl.searchParams;
    const senderId = searchParams.get("senderId");
    const receiverId = searchParams.get("receiverId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    // Validation
    if (!senderId || !receiverId) {
      return NextResponse.json(
        { message: "senderId and receiverId are required." },
        { status: 400 }
      );
    }

    // Không kiểm tra friendship status để xem tin nhắn cũ
    // Cho phép xem tin nhắn cũ ngay cả khi đã unfriend hoặc block
    // Chỉ cần kiểm tra senderId và receiverId hợp lệ

    // Validate và convert ObjectId
    const senderIdObj = normalizeObjectId(senderId);
    const receiverIdObj = normalizeObjectId(receiverId);
    
    if (!senderIdObj || !receiverIdObj) {
      return NextResponse.json(
        { message: "Invalid senderId or receiverId format." },
        { status: 400 }
      );
    }

    // Lấy tin nhắn giữa 2 người (cả 2 chiều) - Tối ưu query với select chỉ lấy fields cần thiết
    const messages = await Messenger.find({
      $or: [
        { senderId: senderIdObj, receiverId: receiverIdObj },
        { senderId: receiverIdObj, receiverId: senderIdObj },
      ],
      isDeleted: false, // Chỉ lấy tin nhắn chưa bị xóa
    })
      .select("_id senderId receiverId content messageType fileUrl fileName fileSize replyTo isRead readAt createdAt updatedAt")
      .populate("senderId", "username email displayName avatar")
      .populate("receiverId", "username email displayName avatar")
      .populate("replyTo", "content senderId")
      .sort({ createdAt: -1 }) // Sắp xếp mới nhất trước
      .limit(Math.min(limit, 100)) // Giới hạn tối đa 100 messages
      .skip(skip)
      .lean(); // Sử dụng lean() để tăng performance (trả về plain objects thay vì Mongoose documents)

    // Đảo ngược để tin nhắn cũ trước, mới sau
    const reversedMessages = messages.reverse();

    return NextResponse.json(
      {
        messages: reversedMessages,
        total: reversedMessages.length,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate', // Không cache messages
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// POST: Gửi tin nhắn mới
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { senderId, receiverId, content, messageType, fileUrl, fileName, fileSize, replyTo } =
      body;

    // Validation
    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { message: "senderId, receiverId, and content are required." },
        { status: 400 }
      );
    }

    // Validate và convert ObjectId
    const mongoose = await import("mongoose");
    const senderIdObj = normalizeObjectId(senderId);
    const receiverIdObj = normalizeObjectId(receiverId);
    
    if (!senderIdObj || !receiverIdObj) {
      return NextResponse.json(
        { message: "Invalid senderId or receiverId format." },
        { status: 400 }
      );
    }

    // Kiểm tra 2 người đã là bạn bè chưa
    const friendship = await Friendship.findOne({
      $or: [
        { userId1: senderIdObj, userId2: receiverIdObj },
        { userId1: receiverIdObj, userId2: senderIdObj },
      ],
      status: "accepted",
    });

    if (!friendship) {
      return NextResponse.json(
        { message: "You are not friends with this user." },
        { status: 403 }
      );
    }

    // Tạo tin nhắn mới - chỉ lưu các field có giá trị
    const messageData: any = {
      senderId: senderIdObj,
      receiverId: receiverIdObj,
      content: content.trim(),
      messageType: messageType || "text",
      isRead: false,
    };

    // Chỉ thêm các field optional khi có giá trị
    if (fileUrl) messageData.fileUrl = fileUrl;
    if (fileName) messageData.fileName = fileName;
    if (fileSize) messageData.fileSize = fileSize;
    if (replyTo) messageData.replyTo = new mongoose.Types.ObjectId(replyTo);

    const newMessage = await Messenger.create(messageData);

    // Populate để trả về thông tin đầy đủ
    const populatedMessage = await Messenger.findById(newMessage._id)
      .populate("senderId", "username email")
      .populate("receiverId", "username email")
      .populate("replyTo", "content senderId")
      .lean();

    return NextResponse.json(
      {
        message: "Message sent successfully!",
        data: populatedMessage,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Log error trong development
    if (process.env.NODE_ENV === "development") {
      console.error("Send message error:", error);
    }
    return NextResponse.json(
      { message: error.message || "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

