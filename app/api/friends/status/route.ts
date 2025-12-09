/**
 * API Route: Get Friendship Status between two users
 * GET /api/friends/status?userId1=xxx&userId2=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import Friendship from "@/app/models/Friendship";
import { normalizeObjectId } from "@/app/lib/utils/serverApiUtils";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const userId1 = searchParams.get("userId1");
    const userId2 = searchParams.get("userId2");

    if (!userId1 || !userId2) {
      return NextResponse.json(
        { message: "userId1 and userId2 are required." },
        { status: 400 }
      );
    }

    // Validate và convert userIds
    const userId1Obj = normalizeObjectId(userId1);
    const userId2Obj = normalizeObjectId(userId2);
    
    if (!userId1Obj || !userId2Obj) {
      return NextResponse.json(
        { message: "Invalid userId format." },
        { status: 400 }
      );
    }

    // Chuẩn hóa: userId1 < userId2 để tránh duplicate
    const [normalizedUserId1, normalizedUserId2] =
      userId1Obj.toString() < userId2Obj.toString()
        ? [userId1Obj, userId2Obj]
        : [userId2Obj, userId1Obj];

    // Tìm friendship
    const friendship = await Friendship.findOne({
      userId1: normalizedUserId1,
      userId2: normalizedUserId2,
    })
      .populate("requestedBy", "id _id")
      .lean();

    if (!friendship) {
      return NextResponse.json(
        {
          status: null,
          friendshipId: null,
          requestedBy: null,
          blockedBy: null,
        },
        { status: 200 }
      );
    }

    // Xác định ai là người block (nếu status là "blocked")
    const blockedBy = friendship.status === "blocked" && friendship.requestedBy
      ? (friendship.requestedBy as any)?._id?.toString() || (friendship.requestedBy as any)?.id?.toString() || null
      : null;

    // Xác định ai là người gửi request (nếu status là "pending")
    const requestedBy = friendship.status === "pending" && friendship.requestedBy
      ? (friendship.requestedBy as any)?._id?.toString() || (friendship.requestedBy as any)?.id?.toString() || null
      : null;

    return NextResponse.json(
      {
        status: friendship.status,
        friendshipId: friendship._id.toString(),
        requestedBy: requestedBy,
        blockedBy: blockedBy,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error getting friendship status:", error);
    return NextResponse.json(
      {
        message: "An error occurred. Please try again.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

