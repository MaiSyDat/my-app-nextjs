/**
 * Script để generate VAPID keys cho web-push
 * 
 * Chạy: node scripts/generate-vapid-keys.js
 * 
 * Lưu keys vào .env.local:
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
 * VAPID_PRIVATE_KEY=...
 */

const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Public Key (NEXT_PUBLIC_VAPID_PUBLIC_KEY):');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key (VAPID_PRIVATE_KEY):');
console.log(vapidKeys.privateKey);
console.log('\n=== Add these to your .env.local file ===\n');

