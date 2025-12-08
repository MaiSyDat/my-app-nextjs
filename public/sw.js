/**
 * Service Worker để nhận Push Notifications
 * 
 * Service Worker này:
 * - Đăng ký để nhận push notifications
 * - Hiển thị notification khi nhận được push event
 * - Xử lý click vào notification để mở ứng dụng
 */

self.addEventListener('push', function(event) {
  console.log('[SW] Push event received:', event);
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
      console.log('[SW] Push data:', data);
    } catch (e) {
      const text = event.data.text();
      data = { title: 'New Message', body: text || 'You have a new message' };
      console.log('[SW] Push data (text):', text);
    }
  }

  const options = {
    title: data.title || 'New Message',
    body: data.body || 'You have a new message',
    icon: data.icon || '/icon/notification.svg',
    badge: '/icon/badge.svg',
    tag: data.tag || `message-${Date.now()}`, // Unique tag để không replace notification cũ
    data: data.data || {},
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    // Renotify: true để hiển thị lại notification ngay cả khi cùng tag (nhưng chúng ta dùng unique tag)
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options).then(() => {
      console.log('[SW] Notification shown:', options.title);
    }).catch((error) => {
      console.error('[SW] Error showing notification:', error);
    })
  );
});

// Xử lý click vào notification
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/discord';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Tìm window đã mở
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Mở window mới nếu chưa có
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

