/**
 * API Route: Friends Management
 * 
 * GET: Lấy danh sách bạn bè hoặc pending requests
 * POST: Gửi lời mời kết bạn
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import Friendship from "@/app/models/Friendship";
import User from "@/app/models/User"; // Import User model để đảm bảo được đăng ký trước khi populate
import mongoose from "mongoose";

/**
 * GET /api/friends
 * Query params:
 * - userId: ID của user cần lấy danh sách bạn bè
 * - status: "accepted" | "pending" | "blocked" (default: "accepted")
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") || "accepted";

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required." },
        { status: 400 }
      );
    }

    // Validate và convert userId
    let userIdObj: mongoose.Types.ObjectId;
    try {
      userIdObj = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      return NextResponse.json(
        { message: "Invalid userId format." },
        { status: 400 }
      );
    }

    // Sử dụng aggregation pipeline để tối ưu query
    const friendships = await Friendship.aggregate([
      // Match friendships có chứa userId và status phù hợp
      {
        $match: {
          $or: [{ userId1: userIdObj }, { userId2: userIdObj }],
          status: status,
        },
      },
      // Lookup user1
      {
        $lookup: {
          from: "users",
          localField: "userId1",
          foreignField: "_id",
          as: "user1",
        },
      },
      // Lookup user2
      {
        $lookup: {
          from: "users",
          localField: "userId2",
          foreignField: "_id",
          as: "user2",
        },
      },
      // Lookup requestedBy
      {
        $lookup: {
          from: "users",
          localField: "requestedBy",
          foreignField: "_id",
          as: "requester",
        },
      },
      // Unwind arrays
      {
        $unwind: {
          path: "$user1",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$user2",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$requester",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Project để format dữ liệu
      {
        $project: {
          _id: 1,
          userId1: 1,
          userId2: 1,
          status: 1,
          acceptedAt: 1,
          createdAt: 1,
          user1: {
            _id: "$user1._id",
            username: "$user1.username",
            email: "$user1.email",
          },
          user2: {
            _id: "$user2._id",
            username: "$user2.username",
            email: "$user2.email",
          },
          requester: {
            _id: "$requester._id",
            username: "$requester.username",
            email: "$requester.email",
          },
        },
      },
      // Sort theo createdAt
      {
        $sort: { createdAt: -1 },
      },
    ]);

    // Format lại dữ liệu để trả về
    const friends = friendships
      .map((friendship: any) => {
        // Xác định friend (người không phải current user)
        const userId1Str = friendship.userId1?.toString() || "";
        const userId2Str = friendship.userId2?.toString() || "";
        const currentUserIdStr = userIdObj.toString();

        let friend: any;
        if (userId1Str === currentUserIdStr) {
          friend = friendship.user2;
        } else if (userId2Str === currentUserIdStr) {
          friend = friendship.user1;
        } else {
          return null; // Không nên xảy ra
        }

        // Kiểm tra friend có tồn tại không
        if (!friend || !friend._id) {
          return null;
        }

        return {
          friendshipId: friendship._id.toString(),
          friend: {
            id: friend._id.toString(),
            username: friend.username || "Unknown",
            email: friend.email || "",
          },
          status: friendship.status,
          requestedBy: friendship.requester
            ? {
                id: friendship.requester._id.toString(),
                username: friendship.requester.username || "Unknown",
                email: friendship.requester.email || "",
              }
            : null,
          acceptedAt: friendship.acceptedAt,
          createdAt: friendship.createdAt,
        };
      })
      .filter((friend: any) => friend !== null);

    return NextResponse.json(
      {
        friends,
        total: friends.length,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60', // Cache 60 giây cho friends list
        }
      }
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

/**
 * POST /api/friends
 * Body: { userId1, userId2 }
 * Gửi lời mời kết bạn từ userId1 đến userId2
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId1, userId2 } = body;

    if (!userId1 || !userId2) {
      return NextResponse.json(
        { message: "userId1 and userId2 are required." },
        { status: 400 }
      );
    }

    if (userId1 === userId2) {
      return NextResponse.json(
        { message: "Cannot send friend request to yourself." },
        { status: 400 }
      );
    }

    // Convert và normalize
    const userId1Obj = new mongoose.Types.ObjectId(userId1);
    const userId2Obj = new mongoose.Types.ObjectId(userId2);

    // Chuẩn hóa: userId1 < userId2 để tránh duplicate
    const [normalizedUserId1, normalizedUserId2] =
      userId1Obj.toString() < userId2Obj.toString()
        ? [userId1Obj, userId2Obj]
        : [userId2Obj, userId1Obj];

    // Kiểm tra đã có mối quan hệ chưa
    const existingFriendship = await Friendship.findOne({
      userId1: normalizedUserId1,
      userId2: normalizedUserId2,
    });

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        return NextResponse.json(
          { message: "You are already friends." },
          { status: 400 }
        );
      }
      if (existingFriendship.status === "pending") {
        return NextResponse.json(
          { message: "Friend request already sent." },
          { status: 400 }
        );
      }
      if (existingFriendship.status === "blocked") {
        return NextResponse.json(
          { message: "This user is blocked." },
          { status: 403 }
        );
      }
    }

    // Tạo friendship mới
    const newFriendship = await Friendship.create({
      userId1: normalizedUserId1,
      userId2: normalizedUserId2,
      status: "pending",
      requestedBy: userId1Obj, // Người gửi là userId1 ban đầu (trước khi normalize)
    });

    // Populate và trả về
    const populatedFriendship = await Friendship.findById(newFriendship._id)
      .populate("userId1", "username email")
      .populate("userId2", "username email")
      .populate("requestedBy", "username email")
      .lean();

    return NextResponse.json(
      {
        message: "Friend request sent successfully!",
        data: populatedFriendship,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "CastError") {
      return NextResponse.json(
        { message: "Invalid user ID format." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        message: "An error occurred. Please try again.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
