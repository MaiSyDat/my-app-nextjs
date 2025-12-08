/**
 * Custom Hook quản lý Friends State tập trung
 * 
 * Hook này cung cấp:
 * - Friends list (accepted)
 * - Pending requests (incoming/outgoing)
 * - Functions để fetch, accept, reject friend requests
 * - Auto-refresh khi cần
 */

import { useState, useEffect, useCallback, useRef } from "react";

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

interface UseFriendsReturn {
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
  refreshAll: () => Promise<void>;
}

export function useFriends(): UseFriendsReturn {
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

  // Fetch danh sách bạn bè đã chấp nhận
  const fetchFriends = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setFriends([]);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/friends?userId=${userId}&status=accepted`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch friends: ${response.status}`);
      }

      const data = await response.json();
      setFriends(data.friends || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch friends");
      setFriends([]);
    }
  }, [getCurrentUserId]);

  // Fetch danh sách pending requests (chỉ incoming - người khác gửi cho mình)
  const fetchPendingRequests = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setPendingRequests([]);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/friends?userId=${userId}&status=pending`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pending requests: ${response.status}`);
      }

      const data = await response.json();
      const userIdStr = userId.toString();
      
      // Lọc chỉ lấy các request mà user hiện tại là người nhận (không phải người gửi)
      const incomingRequests = (data.friends || []).filter((req: any) => {
        const requestedById = req.requestedBy?._id?.toString() || 
                            req.requestedBy?.id?.toString() || 
                            req.requestedBy?.toString();
        return requestedById && requestedById !== userIdStr;
      });

      setPendingRequests(incomingRequests);
    } catch (err: any) {
      setError(err.message || "Failed to fetch pending requests");
      setPendingRequests([]);
    }
  }, [getCurrentUserId]);

  // Chấp nhận lời mời kết bạn
  const acceptRequest = useCallback(async (friendshipId: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`/api/friends/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to accept request");
      }

      // Refresh cả 2 danh sách
      await Promise.all([fetchFriends(), fetchPendingRequests()]);
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to accept request");
      return false;
    }
  }, [fetchFriends, fetchPendingRequests]);

  // Từ chối/xóa lời mời kết bạn
  const rejectRequest = useCallback(async (friendshipId: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`/api/friends/reject`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject request");
      }

      // Refresh pending requests
      await fetchPendingRequests();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to reject request");
      return false;
    }
  }, [fetchPendingRequests]);

  // Gửi lời mời kết bạn
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

      // Refresh pending requests để hiển thị outgoing requests nếu cần
      await fetchPendingRequests();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to send friend request");
      return false;
    }
  }, [getCurrentUserId, fetchPendingRequests]);

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

  return {
    friends,
    pendingRequests,
    loading,
    error,
    fetchFriends,
    fetchPendingRequests,
    acceptRequest,
    rejectRequest,
    sendFriendRequest,
    refreshAll,
  };
}

