/**
 * Shared types và interfaces cho toàn bộ ứng dụng
 */

// Message type
export interface Message {
  id: number;
  type?: string;
  date?: string;
  author?: string;
  avatar?: string;
  timestamp?: string;
  content?: string;
  icon?: string;
  createdAt?: Date | string;
}

// Chat User type
export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  tag: string;
  email: string;
  username?: string; // Username của user
  friendshipStatus?: string; // Thêm friendship status
  blockedBy?: string | null; // ID của người đã block (nếu bị block)
  requestedBy?: string | null; // ID của người đã gửi friend request (nếu status là pending)
  friendshipId?: string; // ID của friendship để accept/reject request
}


