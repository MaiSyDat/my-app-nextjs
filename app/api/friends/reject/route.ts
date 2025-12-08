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

    // Tìm và xóa friendship
    const friendship = await Friendship.findByIdAndDelete(friendshipIdObj);

    if (!friendship) {
      return NextResponse.json(
        { message: "Friendship not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Friend request rejected/deleted.",
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
