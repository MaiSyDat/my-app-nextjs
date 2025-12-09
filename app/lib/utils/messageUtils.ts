/**
 * Utility functions để xử lý message data
 * 
 * Các hàm này:
 * - formatMessage: Format message data từ API để hiển thị trong UI
 * - markMessagesAsRead: Đánh dấu tin nhắn đã đọc
 */

import { getUserIdFromStorage } from "@/app/lib/storage/storageUtils";
import { formatAvatarUrl, getDisplayName, getInitials } from "./userUtils";

export interface FormattedMessage {
  id: number;
  messageId?: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  createdAt: Date | string;
  senderId: string;
}

/**
 * Format message data từ API để hiển thị trong UI
 * @param msg - Message object từ API
 * @param index - Index của message trong array
 * @param currentUserId - ID của user hiện tại
 * @param currentUsername - Username của user hiện tại
 * @param currentUserAvatar - Avatar của user hiện tại
 * @param chatUser - User đang chat với (để lấy thông tin khi message từ họ)
 * @returns Formatted message object
 */
export function formatMessage(
  msg: any,
  index: number,
  currentUserId: string,
  currentUsername: string,
  currentUserAvatar: string | null,
  chatUser: { name: string; avatar?: string | null } | null
): FormattedMessage {
  // Xử lý senderId - có thể là ObjectId string hoặc object đã populate
  let senderIdStr: string;
  if (typeof msg.senderId === 'object' && msg.senderId !== null) {
    // Nếu đã được populate, lấy _id hoặc id
    senderIdStr = msg.senderId._id?.toString() || msg.senderId.id?.toString() || msg.senderId.toString();
  } else {
    // Nếu là string hoặc ObjectId
    senderIdStr = msg.senderId?.toString() || String(msg.senderId);
  }

  // So sánh với userId hiện tại
  const isFromCurrentUser = senderIdStr === currentUserId;
  
  // Lấy tên và avatar người gửi
  let senderName: string;
  let senderAvatar: string;
  
  if (isFromCurrentUser) {
    // Tin nhắn từ user hiện tại
    senderName = currentUsername;
    senderAvatar = formatAvatarUrl(currentUserAvatar) || getInitials(senderName);
  } else {
    // Tin nhắn từ người khác - lấy từ populated object hoặc chatUser
    if (typeof msg.senderId === 'object' && msg.senderId) {
      senderName = getDisplayName({
        displayName: msg.senderId.displayName,
        username: msg.senderId.username
      });
      senderAvatar = formatAvatarUrl(msg.senderId.avatar) || getInitials(senderName);
    } else {
      // Fallback to chatUser
      senderName = chatUser?.name || "Unknown";
      senderAvatar = formatAvatarUrl(chatUser?.avatar) || getInitials(senderName);
    }
  }

  return {
    id: index + 1,
    messageId: msg._id?.toString() || msg.id?.toString(),
    author: senderName,
    avatar: senderAvatar,
    timestamp: new Date(msg.createdAt).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }),
    content: msg.content,
    createdAt: msg.createdAt,
    senderId: senderIdStr,
  };
}

/**
 * Đánh dấu tin nhắn đã đọc
 * @param senderId - ID của người gửi tin nhắn
 * @returns Promise<boolean> - true nếu thành công
 */
export async function markMessagesAsRead(senderId: string): Promise<boolean> {
  try {
    const userId = getUserIdFromStorage();
    if (!userId) return false;

    // Lấy danh sách tin nhắn chưa đọc
    const response = await fetch(
      `/api/messengers?senderId=${senderId}&receiverId=${userId}`
    );
    if (!response.ok) return false;
    
    const data = await response.json();
    const unreadMessages = data.messages?.filter((msg: any) => !msg.isRead) || [];
    if (unreadMessages.length === 0) return true;
    
    // Đánh dấu tất cả tin nhắn chưa đọc là đã đọc
    const messageIds = unreadMessages.map((msg: any) => msg._id || msg.id);
    const readResponse = await fetch("/api/messengers/read", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds, userId }),
    });
    
    return readResponse.ok;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return false;
  }
}

