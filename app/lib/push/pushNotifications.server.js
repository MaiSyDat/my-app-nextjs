/**
 * Utility functions để gửi Push Notifications (JavaScript version cho server.js)
 * 
 * File này là JavaScript version của pushNotifications.ts để có thể require từ server.js
 * Đặt tên .server.js để phân biệt với version TypeScript
 */

const webpush = require('web-push');
const mongoose = require('mongoose');

// Cấu hình VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

/**
 * Kết nối MongoDB (JavaScript version)
 */
async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  // Nếu đã kết nối, return
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Kết nối mới
  await mongoose.connect(MONGODB_URI);
  return mongoose.connection;
}

/**
 * Gửi push notification đến một subscription
 */
async function sendPushNotification(subscription, payload) {
  try {
    const notificationPayload = JSON.stringify(payload);
    await webpush.sendNotification(subscription, notificationPayload);
  } catch (error) {
    // Nếu subscription không hợp lệ (expired), xóa khỏi database
    if (error.statusCode === 410 || error.statusCode === 404) {
      await dbConnect();
      const PushSubscription = mongoose.model('PushSubscription');
      if (PushSubscription) {
        await PushSubscription.deleteOne({ endpoint: subscription.endpoint });
      }
    }
    throw error;
  }
}

/**
 * Gửi push notification đến tất cả subscriptions của một user
 */
async function sendPushNotificationToUser(userId, payload) {
  await dbConnect();

  // Định nghĩa schema nếu chưa có
  if (!mongoose.models.PushSubscription) {
    const PushSubscriptionSchema = new mongoose.Schema({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
      },
      endpoint: {
        type: String,
        required: true,
        unique: true,
      },
      keys: {
        p256dh: {
          type: String,
          required: true,
        },
        auth: {
          type: String,
          required: true,
        },
      },
    }, {
      timestamps: true,
    });

    mongoose.model('PushSubscription', PushSubscriptionSchema);
  }

  const PushSubscription = mongoose.model('PushSubscription');
  const subscriptions = await PushSubscription.find({
    userId: new mongoose.Types.ObjectId(userId),
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
      console.error(`[Push] Error sending to subscription ${sub.endpoint}:`, error.message);
    })
  );

  const results = await Promise.allSettled(promises);
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  console.log(`[Push] Sent ${successCount}/${subscriptions.length} notifications successfully`);
}

module.exports = {
  sendPushNotification,
  sendPushNotificationToUser,
};

