/**
 * API Route: Chặn user
 * 
 * PUT /api/friends/block
 * Body: { userId, blockedUserId }
 * - Chặn một user (cập nhật hoặc tạo friendship với status = "blocked")
 * - Nếu đã là bạn bè, cập nhật status thành "blocked"
 * - Nếu chưa có mối quan hệ, tạo mới với status = "blocked"
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
        { message: "Cannot block yourself." },
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

    // Tìm mối quan hệ hiện tại
    const existingFriendship = await Friendship.findOne({
      userId1: normalizedUserId1,
      userId2: normalizedUserId2,
    });

    if (existingFriendship) {
      // Cập nhật status thành "blocked"
      existingFriendship.status = "blocked";
      existingFriendship.requestedBy = userIdObj; // Người chặn
      await existingFriendship.save();

      return NextResponse.json(
        {
          message: "User blocked successfully.",
          data: existingFriendship,
        },
        { status: 200 }
      );
    } else {
      // Tạo mới với status = "blocked"
      const newFriendship = await Friendship.create({
        userId1: normalizedUserId1,
        userId2: normalizedUserId2,
        status: "blocked",
        requestedBy: userIdObj,
      });

      return NextResponse.json(
        {
          message: "User blocked successfully.",
          data: newFriendship,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Error blocking user:", error);
    return NextResponse.json(
      {
        message: "Internal server error.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}



