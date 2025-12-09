/**
 * API Route: Get và Update User
 * 
 * GET /api/users/[userId] - Lấy thông tin user
 * PUT /api/users/[userId] - Cập nhật thông tin user
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import User from "@/app/models/User";
import mongoose from "mongoose";
import { normalizeObjectId } from "@/app/lib/utils/serverApiUtils";

/**
 * GET /api/users/[userId]
 * Lấy thông tin user theo ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    await dbConnect();

    const { userId } = await Promise.resolve(params);

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

    // Tìm user (không bao gồm password)
    const user = await User.findById(userIdObj).select("-password");

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          _id: user._id.toString(),
          username: user.username,
          email: user.email,
          avatar: user.avatar || null,
          displayName: user.displayName || null,
          phoneNumber: user.phoneNumber || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[userId]
 * Cập nhật thông tin user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    await dbConnect();

    const { userId } = await Promise.resolve(params);
    const body = await request.json();

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

    // Tìm user
    const user = await User.findById(userIdObj);

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    // Cập nhật các trường được phép - cho phép tạo mới các trường nếu chưa có
    const allowedFields = ["displayName", "username", "email", "phoneNumber", "avatar"];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Cho phép set null hoặc empty string cho phoneNumber và avatar
        if (field === "phoneNumber" || field === "avatar") {
          // Nếu là null hoặc empty string thì set null, ngược lại giữ nguyên giá trị
          updateData[field] = (body[field] === null || body[field] === "") ? null : body[field];
        } else if (field === "displayName") {
          // displayName: nếu là empty string thì set null, nếu có giá trị thì giữ nguyên
          updateData[field] = (body[field] === "" || body[field] === null) ? null : body[field];
        } else {
          // username và email: chỉ cập nhật nếu có giá trị hợp lệ
          if (body[field] !== null && body[field] !== "" && body[field] !== undefined) {
            updateData[field] = body[field];
          }
        }
      }
    }

    // Kiểm tra xem có dữ liệu để cập nhật không
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No fields to update." },
        { status: 400 }
      );
    }

    // Nếu cập nhật username, kiểm tra duplicate
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await User.findOne({ username: updateData.username });
      if (existingUser && existingUser._id.toString() !== userId) {
        return NextResponse.json(
          { message: "Username đã được sử dụng." },
          { status: 400 }
        );
      }
    }

    // Nếu cập nhật email, kiểm tra duplicate
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return NextResponse.json(
          { message: "Email đã được sử dụng." },
          { status: 400 }
        );
      }
    }

    // Update user trong database
    const updateResult = await User.updateOne(
      { _id: userIdObj },
      { $set: updateData },
      { runValidators: true }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    // Fetch lại user sau khi update
    const updatedUser = await User.findById(userIdObj).select("-password");

    if (!updatedUser) {
      return NextResponse.json(
        { message: "User not found after update." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "User updated successfully.",
        user: {
          id: updatedUser._id.toString(),
          _id: updatedUser._id.toString(),
          username: updatedUser.username,
          email: updatedUser.email,
          avatar: updatedUser.avatar || null,
          displayName: updatedUser.displayName || null,
          phoneNumber: updatedUser.phoneNumber || null,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

