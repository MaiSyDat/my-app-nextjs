/**
 * Utility functions để gửi Push Notifications
 * 
 * Các hàm này:
 * - sendPushNotification: Gửi notification đến một subscription
 * - sendPushNotificationToUser: Gửi notification đến tất cả subscriptions của một user
 * - Sử dụng web-push library
 */

import webpush from "web-push";
import dbConnect from "@/app/lib/database/mongodb";
import PushSubscription from "@/app/models/PushSubscription";

// Cấu hình VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

/**
 * Gửi push notification đến một subscription
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
): Promise<void> {
  try {
    const notificationPayload = JSON.stringify(payload);
    await webpush.sendNotification(subscription, notificationPayload);
  } catch (error: any) {
    // Nếu subscription không hợp lệ (expired), xóa khỏi database
    if (error.statusCode === 410 || error.statusCode === 404) {
      await dbConnect();
      await PushSubscription.deleteOne({ endpoint: subscription.endpoint });
    }
    throw error;
  }
}

/**
 * Gửi push notification đến tất cả subscriptions của một user
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
): Promise<void> {
  await dbConnect();

  const subscriptions = await PushSubscription.find({
    userId: userId,
  });

  if (subscriptions.length === 0) {
    console.log(`[Push] No subscriptions found for user ${userId}`);
    return;
  }

  console.log(`[Push] Sending notification to ${subscriptions.length} subscription(s) for user ${userId}`);

  // Gửi đến tất cả subscriptions của user
  const promises = subscriptions.map((sub) =>
    sendPushNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      },
      payload
    ).catch((error) => {
      // Log error nhưng không throw để các subscriptions khác vẫn được gửi
      console.error(`[Push] Error sending to subscription ${sub.endpoint}:`, error);
    })
  );

  const results = await Promise.allSettled(promises);
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  console.log(`[Push] Sent ${successCount}/${subscriptions.length} notifications successfully`);
}

