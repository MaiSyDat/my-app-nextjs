/**
 * API Route: Unsubscribe Push Notifications
 * 
 * DELETE /api/push/unsubscribe
 * Body: { endpoint: string, userId: string }
 * 
 * Xử lý:
 * - Xóa push subscription khỏi database
 * - Xóa subscription theo endpoint và userId
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
import PushSubscription from "@/app/models/PushSubscription";
import mongoose from "mongoose";

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { endpoint, userId } = body;

    // Validation
    if (!endpoint) {
      return NextResponse.json(
        { message: "endpoint is required." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required." },
        { status: 400 }
      );
    }

    // Xóa subscription
    await PushSubscription.deleteOne({
      endpoint: endpoint,
      userId: new mongoose.Types.ObjectId(userId),
    });

    return NextResponse.json(
      { message: "Subscription removed successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API] Error removing subscription:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

