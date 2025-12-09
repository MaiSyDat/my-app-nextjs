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
import { normalizeObjectId } from "@/app/lib/utils/serverApiUtils";

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
    const userIdObj = normalizeObjectId(userId);
    if (!userIdObj) {
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
            displayName: "$user1.displayName",
            avatar: "$user1.avatar",
          },
          user2: {
            _id: "$user2._id",
            username: "$user2.username",
            email: "$user2.email",
            displayName: "$user2.displayName",
            avatar: "$user2.avatar",
          },
          requester: {
            _id: "$requester._id",
            username: "$requester.username",
            email: "$requester.email",
            displayName: "$requester.displayName",
            avatar: "$requester.avatar",
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
            displayName: friend.displayName || null,
            avatar: friend.avatar || null,
          },
          status: friendship.status,
          requestedBy: friendship.requester
            ? {
                id: friendship.requester._id.toString(),
                username: friendship.requester.username || "Unknown",
                email: friendship.requester.email || "",
                displayName: friendship.requester.displayName || null,
                avatar: friendship.requester.avatar || null,
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

    // Kiểm tra đã có mối quan hệ chưa
    const existingFriendship = await Friendship.findOne({
      userId1: normalizedUserId1,
      userId2: normalizedUserId2,
    });

    let friendshipToReturn;

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
      // Nếu status là "unfriended", cập nhật thành "pending" thay vì tạo mới
      if (existingFriendship.status === "unfriended") {
        existingFriendship.status = "pending";
        existingFriendship.requestedBy = userId1Obj; // Người gửi là userId1 ban đầu (trước khi normalize)
        await existingFriendship.save({ validateBeforeSave: false }); // Tạm thời bypass validation
        friendshipToReturn = existingFriendship;
      } else {
        // Nếu có existingFriendship nhưng không match các điều kiện trên, không làm gì
        return NextResponse.json(
          { message: "Cannot process this friendship status." },
          { status: 400 }
        );
      }
    } else {
      // Tạo friendship mới nếu chưa có
      const newFriendship = await Friendship.create({
        userId1: normalizedUserId1,
        userId2: normalizedUserId2,
        status: "pending",
        requestedBy: userId1Obj, // Người gửi là userId1 ban đầu (trước khi normalize)
      });
      friendshipToReturn = newFriendship;
    }

    // Populate và trả về
    const populatedFriendship = await Friendship.findById(friendshipToReturn._id)
      .populate("userId1", "username email displayName avatar")
      .populate("userId2", "username email displayName avatar")
      .populate("requestedBy", "username email displayName avatar")
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

/**
 * DELETE /api/friends
 * Body: { userId, friendId }
 * Xóa bạn (unfriend) - xóa friendship với status = "accepted"
 */
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, friendId } = body;

    if (!userId || !friendId) {
      return NextResponse.json(
        { message: "userId and friendId are required." },
        { status: 400 }
      );
    }

    if (userId === friendId) {
      return NextResponse.json(
        { message: "Cannot unfriend yourself." },
        { status: 400 }
      );
    }

    // Convert và normalize
    const userIdObj = normalizeObjectId(userId);
    const friendIdObj = normalizeObjectId(friendId);
    
    if (!userIdObj || !friendIdObj) {
      return NextResponse.json(
        { message: "Invalid userId or friendId format." },
        { status: 400 }
      );
    }

    // Chuẩn hóa: userId1 < userId2 để tránh duplicate
    const [normalizedUserId1, normalizedUserId2] =
      userIdObj.toString() < friendIdObj.toString()
        ? [userIdObj, friendIdObj]
        : [friendIdObj, userIdObj];

    // Tìm friendship và cập nhật status thành "unfriended" thay vì xóa
    const friendship = await Friendship.findOne({
      userId1: normalizedUserId1,
      userId2: normalizedUserId2,
      status: "accepted", // Chỉ unfriend nếu đã là bạn bè
    });

    if (!friendship) {
      return NextResponse.json(
        { message: "Friendship not found or not accepted." },
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
        message: "Friend removed successfully.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error removing friend:", error);
    return NextResponse.json(
      {
        message: "Internal server error.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
