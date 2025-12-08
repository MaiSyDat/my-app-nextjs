/**
 * Context UserStatusContext - Quản lý trạng thái của tất cả users
 * 
 * Context này:
 * - Lưu trữ trạng thái (online/idle/offline) của tất cả users
 * - Lắng nghe Socket.io events để cập nhật trạng thái
 * - Cung cấp hook useUserStatus để truy cập trạng thái
 */

"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getUserIdFromStorage, getSocketUrl } from "@/app/lib/utils";

export type UserStatus = "online" | "idle" | "offline";

interface UserStatusContextType {
  /** Map userId -> status */
  userStatuses: Record<string, UserStatus>;
  /** Lấy trạng thái của một user */
  getUserStatus: (userId: string) => UserStatus;
}

const UserStatusContext = createContext<UserStatusContextType | undefined>(undefined);

// Provider component
export function UserStatusProvider({ children }: { children: React.ReactNode }) {
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({});
  const socketRef = useRef<Socket | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  /**
   * Lấy trạng thái của một user (mặc định: "offline")
   */
  const getUserStatus = useCallback((userId: string): UserStatus => {
    return userStatuses[userId] || "offline";
  }, [userStatuses]);

  /**
   * Kết nối Socket.io để lắng nghe status updates
   */
  useEffect(() => {
    const userId = getUserIdFromStorage();
    if (!userId) return;

    currentUserIdRef.current = userId;

    // Kết nối Socket.io
    const socket = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Khi kết nối thành công
    socket.on("connect", () => {
      socket.emit("user:connect", userId);
    });

    /**
     * Handler nhận status update từ server
     * - Khi một user thay đổi trạng thái (online/idle/offline)
     */
    const handleUserStatus = (data: { userId: string; status: UserStatus }) => {
      setUserStatuses((prev) => ({
        ...prev,
        [data.userId]: data.status,
      }));
    };

    /**
     * Handler nhận user online event
     * - Khi một user connect/online
     */
    const handleUserOnline = (userId: string) => {
      setUserStatuses((prev) => ({
        ...prev,
        [userId]: "online",
      }));
    };

    /**
     * Handler nhận user offline event
     * - Khi một user disconnect/offline
     */
    const handleUserOffline = (userId: string) => {
      setUserStatuses((prev) => ({
        ...prev,
        [userId]: "offline",
      }));
    };

    /**
     * Handler nhận danh sách users online/idle khi mới connect
     * - Server gửi danh sách tất cả users đang online/idle
     */
    const handleUsersStatus = (users: Array<{ userId: string; status: UserStatus }>) => {
      setUserStatuses((prev) => {
        const newStatuses = { ...prev };
        users.forEach(({ userId, status }) => {
          newStatuses[userId] = status;
        });
        return newStatuses;
      });
    };

    // Lắng nghe events
    socket.on("user:status", handleUserStatus);
    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);
    socket.on("users:status", handleUsersStatus);

    // Cleanup
    return () => {
      socket.off("user:status", handleUserStatus);
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
      socket.off("users:status", handleUsersStatus);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <UserStatusContext.Provider
      value={{
        userStatuses,
        getUserStatus,
      }}
    >
      {children}
    </UserStatusContext.Provider>
  );
}

// Hook để sử dụng context
export function useUserStatusContext() {
  const context = useContext(UserStatusContext);
  if (context === undefined) {
    throw new Error("useUserStatusContext must be used within UserStatusProvider");
  }
  return context;
}

