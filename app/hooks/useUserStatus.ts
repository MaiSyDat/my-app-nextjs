/**
 * Hook useUserStatus - Theo dõi trạng thái hoạt động của user
 * 
 * Hook này:
 * - Theo dõi activity của user (mouse, keyboard, scroll, click)
 * - Tự động chuyển sang "idle" sau 5 phút không hoạt động
 * - Broadcast trạng thái qua Socket.io
 * - Trả về trạng thái hiện tại: "online" | "idle" | "offline"
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getUserIdFromStorage, getSocketUrl } from "@/app/lib/utils";

// Thời gian idle (5 phút = 300000ms)
const IDLE_TIMEOUT = 5 * 60 * 1000;

export type UserStatus = "online" | "idle" | "offline";

interface UseUserStatusReturn {
  status: UserStatus;
  isOnline: boolean;
  isIdle: boolean;
  isOffline: boolean;
}

export function useUserStatus(): UseUserStatusReturn {
  const [status, setStatus] = useState<UserStatus>("online");
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string | null>(null);

  /**
   * Reset idle timer - gọi khi có activity
   */
  const resetIdleTimer = useCallback(() => {
    // Clear timer cũ
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Nếu đang idle, chuyển về online và broadcast
    setStatus((prevStatus) => {
      if (prevStatus === "idle") {
        // Broadcast status change ngay lập tức
        if (socketRef.current && userIdRef.current && socketRef.current.connected) {
          socketRef.current.emit("user:status", {
            userId: userIdRef.current,
            status: "online",
          });
        }
        return "online";
      }
      return prevStatus;
    });

    // Set timer mới để chuyển sang idle sau IDLE_TIMEOUT
    idleTimerRef.current = setTimeout(() => {
      setStatus((prevStatus) => {
        if (prevStatus === "online") {
          // Broadcast status change
          if (socketRef.current && userIdRef.current && socketRef.current.connected) {
            socketRef.current.emit("user:status", {
              userId: userIdRef.current,
              status: "idle",
            });
          }
          return "idle";
        }
        return prevStatus;
      });
    }, IDLE_TIMEOUT);
  }, []);

  /**
   * Khởi tạo Socket.io connection và theo dõi activity
   */
  useEffect(() => {
    const userId = getUserIdFromStorage();
    if (!userId) {
      setStatus("offline");
      return;
    }

    userIdRef.current = userId;

    // Kết nối Socket.io
    const socket = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Khi kết nối thành công
    socket.on("connect", () => {
      socket.emit("user:connect", userId);
      // Status sẽ được set trong user:connect handler trên server
      setStatus("online");
      // Khởi tạo idle timer sau khi connect
      setTimeout(() => {
        resetIdleTimer();
      }, 100);
    });

    // Khi disconnect
    socket.on("disconnect", () => {
      setStatus("offline");
    });

    // Event listeners cho user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetIdleTimer();
    };

    // Thêm event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Khởi tạo idle timer
    resetIdleTimer();

    // Cleanup
    return () => {
      // Remove event listeners
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      // Clear timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [resetIdleTimer]);

  return {
    status,
    isOnline: status === "online",
    isIdle: status === "idle",
    isOffline: status === "offline",
  };
}

