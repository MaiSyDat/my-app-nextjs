/**
 * API Route: Subscribe Push Notifications
 * 
 * POST /api/push/subscribe
 * Body: { subscription: PushSubscription, userId: string }
 * 
 * Xử lý:
 * - Lưu push subscription vào database
 * - Mỗi user có thể có nhiều subscriptions (nhiều devices)
 * - Update nếu subscription đã tồn tại (same endpoint)
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/database/mongodb";
// Import models index để đảm bảo PushSubscription được đăng ký
import "@/app/models";
import PushSubscription from "@/app/models/PushSubscription";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Subscribe endpoint called");
    await dbConnect();
    console.log("[API] Database connected");

    const body = await request.json();
    console.log("[API] Request body received:", {
      hasSubscription: !!body.subscription,
      hasUserId: !!body.userId,
      endpoint: body.subscription?.endpoint?.substring(0, 50) + "...",
    });

    const { subscription, userId } = body;

    // Validation
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      console.error("[API] Invalid subscription object:", { subscription });
      return NextResponse.json(
        { message: "Invalid subscription object." },
        { status: 400 }
      );
    }

    if (!userId) {
      console.error("[API] userId is missing");
      return NextResponse.json(
        { message: "userId is required." },
        { status: 400 }
      );
    }

    // Lưu hoặc update subscription
    const subscriptionData = {
      userId: new mongoose.Types.ObjectId(userId),
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    console.log("[API] Subscription data prepared:", {
      userId: subscriptionData.userId.toString(),
      endpoint: subscriptionData.endpoint.substring(0, 50) + "...",
      hasKeys: !!subscriptionData.keys.p256dh && !!subscriptionData.keys.auth,
    });

    // Tìm subscription với endpoint này (có thể đã tồn tại)
    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });

    if (existing) {
      // Update nếu đã tồn tại
      console.log("[API] Updating existing subscription");
      await PushSubscription.updateOne(
        { endpoint: subscription.endpoint },
        { $set: subscriptionData }
      );
      console.log("[API] Subscription updated");
    } else {
      // Tạo mới nếu chưa có
      console.log("[API] Creating new subscription");
      const created = await PushSubscription.create(subscriptionData);
      console.log("[API] Subscription created:", created._id);
    }

    // Verify subscription was saved
    const saved = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    console.log("[API] Subscription verified in database:", !!saved);

    return NextResponse.json(
      { message: "Subscription saved successfully.", saved: !!saved },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API] Error saving subscription:", error);
    console.error("[API] Error stack:", error.stack);
    return NextResponse.json(
      { message: "An error occurred. Please try again.", error: error.message },
      { status: 500 }
    );
  }
}

