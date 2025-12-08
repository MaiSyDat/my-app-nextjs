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

// User type
export interface User {
  id: string;
  username: string;
  email: string;
}

// Friend type
// Friend interface được định nghĩa trong useFriends hook
// Import từ app/hooks/useFriends nếu cần sử dụng

// Chat User type
export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  tag: string;
  email: string;
}

// Pending Request type
export interface PendingRequest {
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    email: string;
  };
  status: string;
  requestedBy: any;
  createdAt: Date;
}

