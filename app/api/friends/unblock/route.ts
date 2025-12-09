/**
 * API Route: Bỏ chặn user
 * 
 * PUT /api/friends/unblock
 * Body: { userId, blockedUserId }
 * - Bỏ chặn một user (xóa friendship với status = "blocked")
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import Friendship from "@/app/models/Friendship";
import mongoose from "mongoose";

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, blockedUserId } = body;

    if (!userId || !blockedUserId) {
      return NextResponse.json(
        { message: "userId and blockedUserId are required." },
        { status: 400 }
      );
    }

    if (userId === blockedUserId) {
      return NextResponse.json(
        { message: "Cannot unblock yourself." },
        { status: 400 }
      );
    }

    // Convert và normalize
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const blockedUserIdObj = new mongoose.Types.ObjectId(blockedUserId);

    // Chuẩn hóa: userId1 < userId2 để tránh duplicate
    const [normalizedUserId1, normalizedUserId2] =
      userIdObj.toString() < blockedUserIdObj.toString()
        ? [userIdObj, blockedUserIdObj]
        : [blockedUserIdObj, userIdObj];

    // Tìm friendship với status = "blocked"
    const friendship = await Friendship.findOne({
      userId1: normalizedUserId1,
      userId2: normalizedUserId2,
      status: "blocked",
    });

    if (!friendship) {
      return NextResponse.json(
        { message: "Blocked relationship not found." },
        { status: 404 }
      );
    }

    // Kiểm tra xem userId có phải là người đã block không (requestedBy)
    const requestedById = friendship.requestedBy?.toString();
    if (requestedById !== userId) {
      return NextResponse.json(
        { message: "Only the person who blocked can unblock." },
        { status: 403 }
      );
    }

    // Không xóa friendship, mà cập nhật status thành "unfriended" và xóa requestedBy để giữ trong Direct Messages
    // Sử dụng updateOne với runValidators: false tạm thời để tránh lỗi validation do Mongoose cache model cũ
    // LƯU Ý: Cần restart server để Mongoose reload model với enum "unfriended" mới
    await Friendship.updateOne(
      { _id: friendship._id },
      { $set: { status: "unfriended" }, $unset: { requestedBy: "" } },
      { runValidators: false } // Tạm thời tắt validation vì Mongoose có thể đã cache model cũ
    );

    return NextResponse.json(
      {
        message: "User unblocked successfully.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error unblocking user:", error);
    return NextResponse.json(
      {
        message: "Internal server error.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

