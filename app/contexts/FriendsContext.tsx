/**
 * Context Provider quản lý Friends State tập trung
 * 
 * Context này cung cấp:
 * - Friends list (accepted)
 * - Pending requests (incoming/outgoing)
 * - Functions để fetch, accept, reject friend requests, unfriend, block
 * - State được chia sẻ giữa tất cả components
 */

"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from "react";

export interface Friend {
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    email: string;
  };
  status: string;
  createdAt: Date;
  acceptedAt?: Date;
}

export interface PendingRequest {
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    email: string;
  };
  status: string;
  requestedBy: {
    id: string;
    username: string;
    email: string;
  };
  createdAt: Date;
}

interface FriendsContextType {
  // State
  friends: Friend[];
  pendingRequests: PendingRequest[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<boolean>;
  rejectRequest: (friendshipId: string) => Promise<boolean>;
  sendFriendRequest: (targetUserId: string) => Promise<boolean>;
  unfriend: (friendId: string) => Promise<boolean>;
  blockUser: (friendId: string) => Promise<boolean>;
  refreshAll: () => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

interface FriendsProviderProps {
  children: ReactNode;
}

export function FriendsProvider({ children }: FriendsProviderProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref để track xem đã fetch lần đầu chưa (tránh fetch nhiều lần)
  const hasFetchedRef = useRef(false);

  // Lấy userId từ localStorage
  const getCurrentUserId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    const userData = localStorage.getItem("user");
    if (!userData) return null;
    try {
      const user = JSON.parse(userData);
      return user.id || user._id || null;
    } catch {
      return null;
    }
  }, []);

  // Fetch danh sách bạn bè đã chấp nhận - tối ưu với cache
  const fetchFriends = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setFriends([]);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/friends?userId=${userId}&status=accepted`, {
        cache: 'no-store', // Đảm bảo luôn lấy dữ liệu mới nhất
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch friends: ${response.status}`);
      }

      const data = await response.json();
      setFriends(data.friends || []);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch friends";
      setError(errorMessage);
      setFriends([]);
      console.error("Error fetching friends:", errorMessage);
    }
  }, [getCurrentUserId]);

  // Fetch danh sách pending requests (chỉ incoming - người khác gửi cho mình) - tối ưu
  const fetchPendingRequests = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setPendingRequests([]);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/friends?userId=${userId}&status=pending`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pending requests: ${response.status}`);
      }

      const data = await response.json();
      const userIdStr = String(userId);
      
      // Lọc chỉ lấy các request mà user hiện tại là người nhận (không phải người gửi)
      // Tối ưu: sử dụng filter một lần, normalize ID trước
      const incomingRequests = (data.friends || []).filter((req: any) => {
        const requestedById = String(
          req.requestedBy?._id || 
          req.requestedBy?.id || 
          req.requestedBy || 
          ""
        );
        return requestedById && requestedById !== userIdStr;
      });

      setPendingRequests(incomingRequests);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch pending requests";
      setError(errorMessage);
      setPendingRequests([]);
      console.error("Error fetching pending requests:", errorMessage);
    }
  }, [getCurrentUserId]);

  // Chấp nhận lời mời kết bạn - optimistic update với rollback
  const acceptRequest = useCallback(async (friendshipId: string): Promise<boolean> => {
    // Tìm request trước để lưu thông tin (tránh closure stale)
    const requestSnapshot = pendingRequests.find(r => r.friendshipId === friendshipId);
    if (!requestSnapshot) {
      setError("Request not found");
      return false;
    }

    // Optimistic update: cập nhật state ngay lập tức
    setPendingRequests(prev => prev.filter(r => r.friendshipId !== friendshipId));
    setFriends(prev => [...prev, {
      friendshipId: requestSnapshot.friendshipId,
      friend: requestSnapshot.friend,
      status: "accepted",
      createdAt: requestSnapshot.createdAt,
      acceptedAt: new Date(),
    }]);

    try {
      setError(null);
      const response = await fetch(`/api/friends/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });

      if (!response.ok) {
        // Rollback nếu API fail
        await fetchPendingRequests();
        await fetchFriends();
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to accept request");
      }

      return true;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to accept request";
      setError(errorMessage);
      console.error("Error accepting request:", errorMessage);
      return false;
    }
  }, [pendingRequests, fetchPendingRequests, fetchFriends]);

  // Từ chối/xóa lời mời kết bạn - optimistic update
  const rejectRequest = useCallback(async (friendshipId: string): Promise<boolean> => {
    // Optimistic update: xóa khỏi pendingRequests ngay lập tức
    setPendingRequests(prev => prev.filter(r => r.friendshipId !== friendshipId));

    try {
      setError(null);
      const response = await fetch(`/api/friends/reject`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });

      if (!response.ok) {
        // Rollback nếu API fail
        await fetchPendingRequests();
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to reject request");
      }

      return true;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to reject request";
      setError(errorMessage);
      console.error("Error rejecting request:", errorMessage);
      return false;
    }
  }, [fetchPendingRequests]);

  // Gửi lời mời kết bạn - không cần cập nhật state vì chỉ gửi request
  const sendFriendRequest = useCallback(async (targetUserId: string): Promise<boolean> => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("User not logged in");
      return false;
    }

    try {
      setError(null);
      const response = await fetch(`/api/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId1: userId, userId2: targetUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send friend request");
      }

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to send friend request");
      return false;
    }
  }, [getCurrentUserId]);

  // Xóa bạn (unfriend) - optimistic update với rollback
  const unfriend = useCallback(async (friendId: string): Promise<boolean> => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("User not logged in");
      return false;
    }

    // Optimistic update: xóa khỏi friends ngay lập tức
    setFriends(prev => prev.filter(f => String(f.friend.id) !== String(friendId)));

    try {
      setError(null);
      const response = await fetch(`/api/friends`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });

      if (!response.ok) {
        // Rollback nếu API fail
        await fetchFriends();
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to unfriend");
      }

      return true;
    } catch (err: any) {
      // Rollback nếu có lỗi
      await fetchFriends();
      const errorMessage = err.message || "Failed to unfriend";
      setError(errorMessage);
      console.error("Error unfriending:", errorMessage);
      return false;
    }
  }, [getCurrentUserId, fetchFriends]);

  // Chặn user - optimistic update với rollback
  const blockUser = useCallback(async (friendId: string): Promise<boolean> => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("User not logged in");
      return false;
    }

    // Optimistic update: xóa khỏi friends ngay lập tức
    setFriends(prev => prev.filter(f => String(f.friend.id) !== String(friendId)));

    try {
      setError(null);
      const response = await fetch(`/api/friends/block`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, blockedUserId: friendId }),
      });

      if (!response.ok) {
        // Rollback nếu API fail
        await fetchFriends();
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to block user");
      }

      return true;
    } catch (err: any) {
      // Rollback nếu có lỗi
      await fetchFriends();
      const errorMessage = err.message || "Failed to block user";
      setError(errorMessage);
      console.error("Error blocking user:", errorMessage);
      return false;
    }
  }, [getCurrentUserId, fetchFriends]);

  // Refresh tất cả
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchFriends(), fetchPendingRequests()]);
    } finally {
      setLoading(false);
    }
  }, [fetchFriends, fetchPendingRequests]);

  // Auto-fetch chỉ một lần khi mount (khi userId có sẵn)
  useEffect(() => {
    // Chỉ fetch một lần duy nhất khi component mount
    if (hasFetchedRef.current) return;
    
    const userId = getCurrentUserId();
    if (userId) {
      hasFetchedRef.current = true;
      refreshAll();
    }
    // Chỉ chạy một lần khi mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - chỉ chạy một lần

  // Memoize context value để tránh re-render không cần thiết
  const value = useMemo<FriendsContextType>(() => ({
    friends,
    pendingRequests,
    loading,
    error,
    fetchFriends,
    fetchPendingRequests,
    acceptRequest,
    rejectRequest,
    sendFriendRequest,
    unfriend,
    blockUser,
    refreshAll,
  }), [
    friends,
    pendingRequests,
    loading,
    error,
    fetchFriends,
    fetchPendingRequests,
    acceptRequest,
    rejectRequest,
    sendFriendRequest,
    unfriend,
    blockUser,
    refreshAll,
  ]);

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriendsContext(): FriendsContextType {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error("useFriendsContext must be used within a FriendsProvider");
  }
  return context;
}

