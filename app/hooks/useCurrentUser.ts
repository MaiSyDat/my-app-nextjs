/**
 * Custom hook để quản lý current user data
 * 
 * Hook này:
 * - Tự động fetch user data từ localStorage và API
 * - Lắng nghe storage events để cập nhật khi user data thay đổi
 * - Trả về user data đầy đủ với displayName và avatar
 * - Tối ưu với caching và error handling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { getUserFromStorage, getUserIdFromStorage } from "@/app/lib/storage/storageUtils";

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  avatar?: string | null;
}

/**
 * Custom hook để lấy và quản lý current user data
 * @returns CurrentUser object hoặc null
 */
export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null);

  // Fetch user data từ API
  const fetchUserData = useCallback(async () => {
    const storedUser = getUserFromStorage();
    if (!storedUser) {
      setUser(null);
      return;
    }

    const userId = storedUser.id || storedUser._id;
    if (!userId) {
      setUser(null);
      return;
    }

    try {
      // Fetch full user data từ API để lấy displayName và avatar mới nhất
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser({
          id: data.user.id || userId,
          username: data.user.username || storedUser.username || "",
          email: data.user.email || storedUser.email || "",
          displayName: data.user.displayName || null,
          avatar: data.user.avatar || null,
        });
      } else {
        // Fallback to localStorage data
        setUser({
          id: userId,
          username: storedUser.username || "",
          email: storedUser.email || "",
          displayName: (storedUser as any).displayName || null,
          avatar: (storedUser as any).avatar || null,
        });
      }
    } catch (error) {
      // Fallback to localStorage data
      setUser({
        id: userId,
        username: storedUser.username || "",
        email: storedUser.email || "",
        displayName: (storedUser as any).displayName || null,
        avatar: (storedUser as any).avatar || null,
      });
    }
  }, []);

  // Fetch user data khi component mount
  useEffect(() => {
    fetchUserData();

    // Lắng nghe storage events để cập nhật khi user data thay đổi
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          const userId = updatedUser.id || updatedUser._id;
          if (userId) {
            fetchUserData();
          }
        } catch (error) {
          // Silent fail
        }
      }
    };

    // Lắng nghe custom event để refresh khi user update trong cùng tab
    const handleUserUpdate = () => {
      fetchUserData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userUpdated", handleUserUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, [fetchUserData]);

  return user;
}

