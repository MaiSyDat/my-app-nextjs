/**
 * API Route: Accept Friend Request
 * PUT /api/friends/accept
 * Body: { friendshipId }
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import Friendship from "@/app/models/Friendship";
import User from "@/app/models/User"; // Import User model để đảm bảo được đăng ký trước khi populate
import mongoose from "mongoose";

export async function PUT(request: NextRequest) {
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

    // Tìm friendship
    const friendship = await Friendship.findById(friendshipIdObj);

    if (!friendship) {
      return NextResponse.json(
        { message: "Friendship not found." },
        { status: 404 }
      );
    }

    // Kiểm tra trạng thái
    if (friendship.status !== "pending") {
      return NextResponse.json(
        { message: "This friend request is not pending." },
        { status: 400 }
      );
    }

    // Cập nhật trạng thái
    friendship.status = "accepted";
    friendship.acceptedAt = new Date();
    await friendship.save();

    // Populate và trả về
    const populatedFriendship = await Friendship.findById(friendshipIdObj)
      .populate("userId1", "username email")
      .populate("userId2", "username email")
      .populate("requestedBy", "username email")
      .lean();

    return NextResponse.json(
      {
        message: "Friend request accepted!",
        data: populatedFriendship,
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
