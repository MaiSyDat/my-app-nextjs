/**
 * Custom Server với Socket.io cho Next.js
 * 
 * Server này tích hợp Next.js và Socket.io để hỗ trợ:
 * - Next.js app routing và API routes
 * - Socket.io realtime messaging
 * - WebSocket connections cho chat realtime
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

// Cấu hình môi trường
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0'; // Listen on all interfaces để hỗ trợ mạng nội bộ
const port = parseInt(process.env.PORT || '3000', 10);

// Khởi tạo Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  /**
   * HTTP Server - xử lý tất cả HTTP requests
   * - Next.js pages và API routes
   * - Static files
   */
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      // Error handling cho Next.js requests
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  /**
   * Socket.io Server - xử lý WebSocket connections
   * - CORS enabled cho tất cả origins (có thể restrict trong production)
   * - Hỗ trợ cả websocket và polling transports
   */
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket", "polling"],
    // Tối ưu Socket.io performance
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB
    allowEIO3: true,
  });

  /**
   * User Socket Mapping
   * - Lưu trữ mapping userId -> Set<socketId> để gửi tin nhắn đến đúng user
   * - Một user có thể có nhiều socket connections (nhiều tab/device)
   * - Dùng Set để lưu nhiều socketIds cho cùng một userId
   */
  const userSocketMap = new Map(); // userId -> socketId (chỉ lưu socketId mới nhất)
  const userSocketSetMap = new Map(); // userId -> Set<socketId> (lưu tất cả socketIds)
  const userStatusMap = new Map(); // userId -> status (online/idle/offline)

  // Export io để có thể sử dụng ở nơi khác (nếu cần)
  global.io = io;

  /**
   * Socket.io Event Handlers
   * Xử lý các events từ client
   */
  io.on('connection', (socket) => {
    /**
     * Event: user:connect
     * Khi user đăng nhập/connect, lưu userId và socketId
     * - Lưu mapping userId -> socketId (hoặc array nếu có nhiều connections)
     * - Broadcast cho các user khác biết user này online
     */
    socket.on('user:connect', (userId) => {
      if (!userId) return;
      
      // Lưu socketId cho userId (socketId mới nhất)
      userSocketMap.set(userId, socket.id);
      
      // Lưu vào Set để track tất cả socketIds của user này
      if (!userSocketSetMap.has(userId)) {
        userSocketSetMap.set(userId, new Set());
      }
      userSocketSetMap.get(userId).add(socket.id);
      
      // Set status mặc định là "online" khi connect
      userStatusMap.set(userId, 'online');
      
      socket.userId = userId;
      
      // Gửi danh sách tất cả users đang online/idle cho user mới connect
      // Đợi một chút để đảm bảo socket đã sẵn sàng nhận event
      setImmediate(() => {
        const onlineUsers = [];
        userStatusMap.forEach((status, uid) => {
          if (uid !== userId && (status === 'online' || status === 'idle')) {
            onlineUsers.push({ userId: uid, status });
          }
        });
        
        // Gửi danh sách users online/idle cho user mới (luôn gửi, kể cả rỗng)
        socket.emit('users:status', onlineUsers);
      });
      
      // Broadcast cho các user khác biết user này online
      socket.broadcast.emit('user:online', userId);
      socket.broadcast.emit('user:status', {
        userId: userId,
        status: 'online',
      });
    });

    /**
     * Event: user:status
     * Khi user thay đổi trạng thái (online/idle/offline)
     * - Lưu trạng thái vào userStatusMap
     * - Broadcast cho các user khác biết trạng thái mới
     */
    socket.on('user:status', (data) => {
      if (!data || !data.userId || !data.status) return;
      
      // Lưu trạng thái vào map
      userStatusMap.set(data.userId, data.status);
      
      // Broadcast cho các user khác biết trạng thái mới
      socket.broadcast.emit('user:status', {
        userId: data.userId,
        status: data.status,
      });
    });

    /**
     * Event: message:send
     * Khi user gửi tin nhắn
     * - Tìm socketId của người nhận
     * - Gửi tin nhắn đến người nhận (nếu đang online)
     * - Gửi lại cho người gửi để confirm (optimistic update)
     */
    socket.on('message:send', async (data) => {
      const { senderId, receiverId, content, messageType } = data;

      // Validation
      if (!senderId || !receiverId || !content) {
        socket.emit('message:error', { message: 'Invalid message data' });
        return;
      }

      // Tìm socketId của người nhận
      const receiverSocketId = userSocketMap.get(receiverId);
      
      // Tạo messageId unique cho mỗi tin nhắn (dùng timestamp + random để đảm bảo unique)
      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const messageData = {
        _id: messageId,
        senderId,
        receiverId,
        content,
        messageType: messageType || 'text',
        createdAt: new Date(),
      };

      // Gửi tin nhắn đến người nhận (nếu đang online)
      // Gửi đến TẤT CẢ socketIds của người nhận (nếu có nhiều tabs/connections)
      const receiverSocketIds = userSocketSetMap.get(receiverId);
      if (receiverSocketIds && receiverSocketIds.size > 0) {
        receiverSocketIds.forEach((socketId) => {
          io.to(socketId).emit('message:receive', messageData);
        });
      }

      // Gửi push notification đến người nhận (nếu có subscription)
      // Gửi cả khi user offline (không có socket connection) hoặc khi đang online nhưng muốn nhận notification
      // Chạy async không block
      setImmediate(async () => {
        try {
          const { sendPushNotificationToUser } = require('./app/lib/push/pushNotifications.server.js');
          const mongoose = require('mongoose');
          
          // Kết nối database và lấy username của người gửi
          const MONGODB_URI = process.env.MONGODB_URI;
          if (!mongoose.connection.readyState) {
            await mongoose.connect(MONGODB_URI);
          }
          
          // Định nghĩa User schema nếu chưa có
          if (!mongoose.models.User) {
            const UserSchema = new mongoose.Schema({
              username: { type: String, required: true },
              email: { type: String, required: true, unique: true },
              password: { type: String, required: true },
            }, { timestamps: true });
            mongoose.model('User', UserSchema);
          }
          
          const User = mongoose.model('User');
          const sender = await User.findById(senderId);
          const senderName = sender?.username || 'Someone';
          
          console.log(`[Server] Attempting to send push notification to user ${receiverId}`);
          
          // Gửi push notification (ngay cả khi user đang online, để họ nhận được notification)
          // Sử dụng messageId làm tag để mỗi notification là unique (không replace nhau)
          // Mỗi tin nhắn sẽ có notification riêng, không bị replace
          await sendPushNotificationToUser(receiverId, {
            title: `New message from ${senderName}`,
            body: `${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            icon: '/icon/notification.svg',
            badge: '/icon/badge.svg',
            tag: `message-${messageData._id}`, // Unique tag cho mỗi tin nhắn (không replace)
            data: {
              url: `/discord`,
              senderId: senderId,
              receiverId: receiverId,
              messageId: messageData._id,
            },
          });
          
          console.log(`[Server] ✓ Push notification sent to user ${receiverId}`);
        } catch (error) {
          // Log error nhưng không throw để không ảnh hưởng đến flow chính
          console.error('[Server] ❌ Error sending push notification:', error.message);
          if (error.stack) {
            console.error('[Server] Error stack:', error.stack);
          }
        }
      });

      // Gửi lại cho người gửi để confirm (optimistic update)
      socket.emit('message:sent', messageData);
    });

    /**
     * Event: disconnect
     * Khi user ngắt kết nối
     * - Xóa mapping userId -> socketId
     * - Broadcast cho các user khác biết user này offline
     */
    socket.on('disconnect', () => {
      const userId = socket.userId;
      
      if (userId) {
        // Xóa socketId khỏi Set
        const socketIds = userSocketSetMap.get(userId);
        if (socketIds) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) {
            // Không còn socket nào, user offline
            userSocketSetMap.delete(userId);
            userSocketMap.delete(userId);
            userStatusMap.set(userId, 'offline');
            socket.broadcast.emit('user:offline', userId);
            socket.broadcast.emit('user:status', {
              userId: userId,
              status: 'offline',
            });
          } else {
            // Nếu còn socketIds khác, cập nhật socketId mới nhất
            const latestSocketId = Array.from(socketIds)[socketIds.size - 1];
            userSocketMap.set(userId, latestSocketId);
          }
        } else {
          userSocketMap.delete(userId);
          userStatusMap.set(userId, 'offline');
        }
      }
    });
  });

  /**
   * Start Server
   * - Listen trên port và hostname đã cấu hình
   * - Log thông tin server khi khởi động thành công
   */
  httpServer
    .once('error', (err) => {
      // Error handling cho server startup
      process.exit(1);
    })
    .listen(port, hostname, () => {
      const displayHost = hostname === '0.0.0.0' ? 'localhost' : hostname;
      console.log(`> Ready on http://${displayHost}:${port}`);
      console.log(`> Socket.io server is running`);
      if (hostname === '0.0.0.0') {
        console.log(`> Access from network: http://<your-ip>:${port}`);
      }
    });
});

