/**
 * API Route: Reject/Delete Friend Request
 * DELETE /api/friends/reject
 * Body: { friendshipId }
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import Friendship from "@/app/models/Friendship";
import mongoose from "mongoose";

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { friendshipId } = body;

    if (!friendshipId) {
      return NextResponse.json(
        { message: "friendshipId is required." },
        { status: 400 }
      );
    }

    // Validate friendshipId
    let friendshipIdObj: mongoose.Types.ObjectId;
    try {
      friendshipIdObj = new mongoose.Types.ObjectId(friendshipId);
    } catch (error) {
      return NextResponse.json(
        { message: "Invalid friendshipId format." },
        { status: 400 }
      );
    }

    // Tìm friendship và cập nhật status thành "unfriended" thay vì xóa
    const friendship = await Friendship.findById(friendshipIdObj);

    if (!friendship) {
      return NextResponse.json(
        { message: "Friendship not found." },
        { status: 404 }
      );
    }

    // Cập nhật status thành "unfriended" thay vì xóa
    // Sử dụng updateOne để xóa requestedBy
    await Friendship.updateOne(
      { _id: friendship._id },
      { $set: { status: "unfriended" }, $unset: { requestedBy: "" } },
      { runValidators: false }
    );

    return NextResponse.json(
      {
        message: "Friend request rejected.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "An error occurred. Please try again.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
