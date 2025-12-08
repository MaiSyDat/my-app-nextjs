/**
 * Context quản lý số tin nhắn chưa đọc cho từng user
 * 
 * Context này cung cấp:
 * - Theo dõi số tin nhắn chưa đọc cho mỗi user
 * - Kết nối Socket.io để nhận tin nhắn mới realtime
 * - Tự động tăng unread count khi nhận tin nhắn mới
 * - Reset unread count khi mở chat với user
 * - Fetch unread counts từ database khi load trang
 */

"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getUserIdFromStorage, getSocketUrl } from "@/app/lib/utils";

// Interface cho unread messages count
interface UnreadMessages {
  [userId: string]: number; // userId -> số tin nhắn chưa đọc
}

interface UnreadMessagesContextType {
  unreadCounts: UnreadMessages;
  incrementUnread: (userId: string) => void;
  resetUnread: (userId: string) => void;
  resetAllUnread: () => void;
  setCurrentChatUserId: (userId: string | null) => void; // Để context biết user nào đang được chat
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

// Provider component
export function UnreadMessagesProvider({ children }: { children: React.ReactNode }) {
  const [unreadCounts, setUnreadCounts] = useState<UnreadMessages>({});
  const socketRef = useRef<Socket | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const currentChatUserIdRef = useRef<string | null>(null); // User đang được chat

  /**
   * Fetch unread counts từ database khi load trang
   */
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const userId = getUserIdFromStorage();
      if (!userId) return;

      try {
        const response = await fetch(`/api/messengers/unread-count?receiverId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          // Normalize keys (convert tất cả keys sang string)
          const normalizedCounts: UnreadMessages = {};
          if (data.unreadCounts) {
            Object.entries(data.unreadCounts).forEach(([key, value]) => {
              normalizedCounts[String(key)] = value as number;
            });
          }
          setUnreadCounts(normalizedCounts);
        }
      } catch (error) {
        // Silent fail - sẽ retry khi socket nhận tin nhắn mới
      }
    };

    fetchUnreadCounts();
  }, []);

  /**
   * Kết nối Socket.io để lắng nghe tin nhắn mới
   * - Lấy userId từ localStorage và kết nối socket
   */
  useEffect(() => {
    const userId = getUserIdFromStorage();
    if (!userId) return;
    
    currentUserIdRef.current = userId;

    // Kết nối đến Socket.io server
    const socket = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Khi kết nối thành công, gửi userId lên server
    socket.on("connect", () => {
      socket.emit("user:connect", userId);
    });

    /**
     * Handler nhận tin nhắn mới từ server
     * - Tăng unread count cho người gửi (chỉ khi KHÔNG đang chat với họ)
     * - Sử dụng functional update để tránh stale closure
     */
    const handleMessageReceive = (messageData: {
      senderId: string;
      receiverId: string;
      content: string;
      messageType?: string;
      createdAt?: Date | string;
    }) => {
      // Lấy userId mới nhất từ ref (tránh stale closure)
      const currentUserId = currentUserIdRef.current;
      if (!currentUserId) return;
      
      // Normalize userId để so sánh (convert sang string)
      const receiverIdStr = String(messageData.receiverId);
      const userIdStr = String(currentUserId);
      
      // Chỉ xử lý nếu tin nhắn này dành cho user hiện tại
      if (receiverIdStr !== userIdStr) return;

      // Normalize senderId
      const senderId = String(messageData.senderId);
      
      // Lấy currentChatUserId mới nhất từ ref
      const currentChatUserId = currentChatUserIdRef.current;
      
      // Nếu đang chat với người gửi, không tăng unread count
      if (currentChatUserId === senderId) return;

      // Tăng unread count cho người gửi - sử dụng functional update
      setUnreadCounts((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));
    };
    
    socket.on("message:receive", handleMessageReceive);

    // Cleanup khi unmount
    return () => {
      socket.off("message:receive", handleMessageReceive);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  /**
   * Tăng số tin nhắn chưa đọc cho một user
   */
  const incrementUnread = useCallback((userId: string) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [userId]: (prev[userId] || 0) + 1,
    }));
  }, []);

  /**
   * Reset số tin nhắn chưa đọc cho một user (khi mở chat với họ)
   */
  const resetUnread = useCallback((userId: string) => {
    setUnreadCounts((prev) => {
      if (!prev[userId]) return prev; // Không cần tạo object mới nếu không có key
      const newCounts = { ...prev };
      delete newCounts[userId];
      return newCounts;
    });
  }, []);

  /**
   * Reset tất cả unread counts
   */
  const resetAllUnread = useCallback(() => {
    setUnreadCounts({});
  }, []);

  /**
   * Set user đang được chat (để context biết không tăng unread cho user này)
   */
  const setCurrentChatUserId = useCallback((userId: string | null) => {
    currentChatUserIdRef.current = userId;
  }, []);

  return (
    <UnreadMessagesContext.Provider
      value={{
        unreadCounts,
        incrementUnread,
        resetUnread,
        resetAllUnread,
        setCurrentChatUserId,
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  );
}

// Hook để sử dụng context
export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext);
  if (context === undefined) {
    throw new Error("useUnreadMessages must be used within UnreadMessagesProvider");
  }
  return context;
}

