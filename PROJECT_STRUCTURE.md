# Cấu trúc Dự án

## 📁 Cấu trúc Thư mục

### `/app` - Next.js App Directory

#### `/app/(auth)` - Authentication Pages
- `layout.tsx` - Layout cho auth pages
- `login/page.tsx` - Trang đăng nhập
- `register/page.tsx` - Trang đăng ký

#### `/app/api` - API Routes
- `/api/auth/` - Authentication APIs
  - `login/route.ts` - POST: Đăng nhập
  - `register/route.ts` - POST: Đăng ký
- `/api/friends/` - Friends Management APIs
  - `route.ts` - GET: Lấy danh sách bạn bè, POST: Gửi lời mời
  - `accept/route.ts` - PUT: Chấp nhận lời mời
  - `reject/route.ts` - DELETE: Từ chối/xóa bạn bè
- `/api/messengers/` - Messaging APIs
  - `route.ts` - GET: Lấy tin nhắn, POST: Gửi tin nhắn
  - `read/route.ts` - PUT: Đánh dấu đã đọc
  - `unread-count/route.ts` - GET: Lấy số tin nhắn chưa đọc
- `/api/push/` - Push Notification APIs
  - `subscribe/route.ts` - POST: Subscribe push notifications
  - `unsubscribe/route.ts` - DELETE: Unsubscribe
  - `vapid-public-key/route.ts` - GET: Lấy VAPID public key
- `/api/users/` - User APIs
  - `route.ts` - GET: Lấy thông tin user
  - `search/route.ts` - GET: Tìm kiếm user
- `/api/link-preview/route.ts` - GET: Lấy link preview metadata

#### `/app/contexts` - React Contexts
- `UnreadMessagesContext.tsx` - Context quản lý số tin nhắn chưa đọc

#### `/app/discord` - Discord App Pages
- `page.tsx` - Trang Discord chính

#### `/app/hooks` - Custom Hooks
- `useFriends.ts` - Hook quản lý friends state
- `usePushNotifications.ts` - Hook quản lý push notifications

#### `/app/lib` - Utility Libraries (Tổ chức theo chức năng)

##### `/app/lib/database/` - Database Utilities
- `mongodb.ts` - MongoDB connection utility

##### `/app/lib/push/` - Push Notification Utilities
- `pushNotifications.ts` - Push notifications utility (TypeScript, cho Next.js API)
- `pushNotifications.server.js` - Push notifications utility (JavaScript, cho server.js)

##### `/app/lib/url/` - URL Utilities
- `urlUtils.ts` - URL parsing và validation utilities

##### `/app/lib/storage/` - Storage Utilities
- `storageUtils.ts` - localStorage utilities (getUserFromStorage, getUserIdFromStorage)

##### `/app/lib/socket/` - Socket Utilities
- `socketUtils.ts` - Socket.io utilities (getSocketUrl)

##### `/app/lib/utils.ts` - Common Utilities (Re-export)
- Re-export các utilities từ storage và socket để backward compatibility

#### `/app/models` - Mongoose Models
- `index.ts` - Export tập trung tất cả models
- `User.ts` - User model
- `Friendship.ts` - Friendship model
- `Messenger.ts` - Messenger model
- `PushSubscription.ts` - PushSubscription model

#### `/app/types` - TypeScript Types
- `index.ts` - Shared types và interfaces

#### `/app/ui` - UI Components

##### `/app/ui/common` - Common Components
- `Icon.tsx` - Icon component dùng chung
- `Avatar.tsx` - Avatar component với gradient background
- `StatusIndicator.tsx` - Status indicator (online/offline badge)
- `LoadingSpinner.tsx` - Loading spinner component

##### `/app/ui/discord` - Discord UI Components
- `/auth/` - Authentication Components
  - `AuthGuard.tsx` - Route protection component
- `/chat/` - Chat Components
  - `ChatHeader.tsx` - Header của chat
  - `DateDivider.tsx` - Divider theo ngày
  - `LinkPreview.tsx` - Link preview component
  - `MessageArea.tsx` - Vùng hiển thị tin nhắn
  - `MessageInput.tsx` - Input để gửi tin nhắn
  - `MessageItem.tsx` - Component hiển thị một tin nhắn
  - `MessageList.tsx` - Danh sách tin nhắn
  - `UserProfileHeader.tsx` - Header profile user
- `/friends/` - Friends Components
  - `AddFriendModal.tsx` - Modal thêm bạn bè
  - `FriendsList.tsx` - Danh sách bạn bè
  - `FriendsView.tsx` - View quản lý bạn bè
  - `PendingRequestsList.tsx` - Danh sách lời mời kết bạn
- `/layout/` - Layout Components
  - `ChannelSidebar.tsx` - Sidebar channels và DMs
  - `DiscordLayout.tsx` - Layout chính của Discord
  - `RightSidebar.tsx` - Sidebar bên phải
  - `ServerList.tsx` - Danh sách server
  - `TopBar.tsx` - Top bar
- `/settings/` - Settings Components
  - `SettingsModal.tsx` - Modal cài đặt

##### `/app/ui/login` - Login Components
- `loginForm.tsx` - Form đăng nhập

##### `/app/ui/register` - Register Components
- `registerForm.tsx` - Form đăng ký

##### `/app/ui/toast` - Toast Components
- `index.ts` - Export tập trung
- `Toast.tsx` - Toast component
- `ToastContainer.tsx` - Toast container
- `ToastContext.tsx` - Toast context

### `/public` - Static Files
- `/icon/` - SVG icons
- `/logo/` - Logo files
- `sw.js` - Service Worker cho push notifications

### `/scripts` - Utility Scripts
- `generate-vapid-keys.js` - Generate VAPID keys
- `test-push-notification.js` - Test push notifications

### Root Files
- `server.js` - Custom server với Socket.io
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `next.config.ts` - Next.js config

## 📝 Quy tắc Đặt Tên

### Files
- **Components**: PascalCase (e.g., `MessageArea.tsx`)
- **Hooks**: camelCase với prefix `use` (e.g., `useFriends.ts`)
- **Utilities**: camelCase (e.g., `urlUtils.ts`)
- **Models**: PascalCase (e.g., `User.ts`)
- **API Routes**: `route.ts` trong thư mục tương ứng
- **Server Files**: `.server.js` suffix (e.g., `pushNotifications.server.js`)

### Directories
- **Feature-based**: Tên feature (e.g., `friends/`, `chat/`)
- **Type-based**: Loại component (e.g., `layout/`, `auth/`)
- **Common**: `common/` cho components dùng chung

## 🔍 Tìm Kiếm Files

### Components
- UI Components: `app/ui/`
- Discord Components: `app/ui/discord/`
- Common Components: `app/ui/common/`

### APIs
- Auth APIs: `app/api/auth/`
- Friends APIs: `app/api/friends/`
- Messaging APIs: `app/api/messengers/`
- Push APIs: `app/api/push/`
- User APIs: `app/api/users/`

### Utilities
- Common Utils: `app/lib/utils.ts`
- URL Utils: `app/lib/urlUtils.ts`
- MongoDB: `app/lib/mongodb.ts`
- Push Notifications: `app/lib/pushNotifications.ts` (TypeScript) hoặc `app/lib/pushNotifications.server.js` (JavaScript)

### Models
- All Models: `app/models/`
- Export: `app/models/index.ts`

### Hooks
- All Hooks: `app/hooks/`

### Contexts
- All Contexts: `app/contexts/`

