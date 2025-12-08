/**
 * Script test gửi push notification
 * 
 * Chạy: node scripts/test-push-notification.js <userId>
 * 
 * Script này sẽ:
 * - Tìm subscription của user
 * - Gửi test notification
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const webpush = require('web-push');

// Đọc .env.local manually (không cần dotenv)
function loadEnvFile(filePath) {
  try {
    const envFile = fs.readFileSync(filePath, 'utf8');
    const lines = envFile.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      // Bỏ qua comments và empty lines
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes nếu có
          const cleanValue = value.replace(/^["']|["']$/g, '');
          process.env[key.trim()] = cleanValue;
        }
      }
    });
  } catch (error) {
    // Silent fail
  }
}

// Load .env.local nếu có
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  loadEnvFile(envPath);
  console.log('✓ Loaded environment variables from .env.local');
} else {
  console.log('Note: .env.local not found, using process.env directly');
}

// Import model trực tiếp (cần compile TypeScript hoặc import từ build)
// Thay vào đó, chúng ta sẽ định nghĩa schema trực tiếp trong script này

const MONGODB_URI = process.env.MONGODB_URI;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@example.com';

if (!MONGODB_URI || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Missing environment variables!');
  console.error('Required: MONGODB_URI, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY');
  process.exit(1);
}

// Cấu hình VAPID
webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function testPushNotification(userId) {
  try {
    // Kết nối database
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Định nghĩa schema và model (vì không thể import TypeScript trực tiếp)
    const PushSubscriptionSchema = new mongoose.Schema({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
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

    const PushSubscription = mongoose.models.PushSubscription || 
      mongoose.model('PushSubscription', PushSubscriptionSchema);

    // Tìm subscriptions của user
    const subscriptions = await PushSubscription.find({ userId: userId });
    console.log(`\n✓ Found ${subscriptions.length} subscription(s) for user ${userId}`);

    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions found for this user');
      process.exit(1);
    }

    // Gửi test notification đến tất cả subscriptions
    for (let i = 0; i < subscriptions.length; i++) {
      const sub = subscriptions[i];
      console.log(`\n📤 Sending test notification ${i + 1}/${subscriptions.length}...`);
      console.log(`   Endpoint: ${sub.endpoint.substring(0, 50)}...`);

      try {
        const payload = JSON.stringify({
          title: 'Test Notification',
          body: 'Đây là thông báo test từ server!',
          icon: '/icon/notification.svg',
          badge: '/icon/badge.svg',
          tag: 'test',
          data: {
            url: '/discord',
          },
        });

        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payload
        );

        console.log(`   ✓ Notification sent successfully!`);
      } catch (error) {
        console.error(`   ❌ Error sending notification:`, error.message);
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`   ℹ️  Subscription expired, should be removed from database`);
        }
      }
    }

    console.log('\n✅ Test completed!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Lấy userId từ command line
const userId = process.argv[2];

if (!userId) {
  console.error('Usage: node scripts/test-push-notification.js <userId>');
  console.error('Example: node scripts/test-push-notification.js 692ff6b94005774c1a34a3a0');
  process.exit(1);
}

testPushNotification(userId);

