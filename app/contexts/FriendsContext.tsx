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
    displayName?: string | null;
    avatar?: string | null;
  };
  status: string;
  createdAt: Date;
  acceptedAt?: Date;
  requestedBy?: {
    id: string;
    username: string;
    email: string;
    displayName?: string | null;
    avatar?: string | null;
  } | null;
}

export interface PendingRequest {
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    email: string;
    displayName?: string | null;
    avatar?: string | null;
  };
  status: string;
  requestedBy: {
    id: string;
    username: string;
    email: string;
    displayName?: string | null;
    avatar?: string | null;
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
  unblockUser: (friendId: string) => Promise<boolean>;
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

  /**
   * Lấy ID của user hiện tại từ localStorage
   */
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

  /**
   * Lấy danh sách bạn bè từ API (accepted, blocked, unfriended)
   */
  const fetchFriends = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setFriends([]);
      return;
    }

    try {
      setError(null);
      // Fetch cả accepted, blocked và unfriended users
      const [acceptedResponse, blockedResponse, unfriendedResponse] = await Promise.all([
        fetch(`/api/friends?userId=${userId}&status=accepted`, {
          cache: 'no-store',
        }),
        fetch(`/api/friends?userId=${userId}&status=blocked`, {
          cache: 'no-store',
        }),
        fetch(`/api/friends?userId=${userId}&status=unfriended`, {
          cache: 'no-store',
        }),
      ]);
      
      const acceptedData = acceptedResponse.ok ? await acceptedResponse.json() : { friends: [] };
      const blockedData = blockedResponse.ok ? await blockedResponse.json() : { friends: [] };
      const unfriendedData = unfriendedResponse.ok ? await unfriendedResponse.json() : { friends: [] };
      
      // Merge cả ba lists
      const allFriends = [
        ...(acceptedData.friends || []), 
        ...(blockedData.friends || []), 
        ...(unfriendedData.friends || [])
      ];
      setFriends(allFriends);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch friends";
      setError(errorMessage);
      setFriends([]);
      console.error("Error fetching friends:", errorMessage);
    }
  }, [getCurrentUserId]);

  /**
   * Lấy danh sách lời mời kết bạn đang chờ (chỉ incoming requests)
   */
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

  /**
   * Chấp nhận lời mời kết bạn
   */
  const acceptRequest = useCallback(async (friendshipId: string): Promise<boolean> => {
    // Lưu snapshot trước khi update để rollback nếu API fail (tránh closure stale)
    const requestSnapshot = pendingRequests.find(r => r.friendshipId === friendshipId);
    if (!requestSnapshot) {
      setError("Request not found");
      return false;
    }

    // Optimistic update: cập nhật UI ngay (xóa khỏi pending, thêm vào friends) để UX mượt
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to accept request");
      }

      return true;
    } catch (err: any) {
      // Rollback: khôi phục state ban đầu từ snapshot (thêm lại vào pending, xóa khỏi friends)
      setPendingRequests(prev => [...prev, requestSnapshot]);
      setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
      const errorMessage = err.message || "Failed to accept request";
      setError(errorMessage);
      console.error("Error accepting request:", errorMessage);
      return false;
    }
  }, [pendingRequests]);

  /**
   * Từ chối lời mời kết bạn
   */
  const rejectRequest = useCallback(async (friendshipId: string): Promise<boolean> => {
    // Tìm request trước để lưu thông tin (tránh closure stale)
    const requestSnapshot = pendingRequests.find(r => r.friendshipId === friendshipId);
    if (!requestSnapshot) {
      setError("Request not found");
      return false;
    }

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
        // Rollback nếu API fail - chỉ rollback state, không refresh
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to reject request");
      }

      return true;
    } catch (err: any) {
      // Rollback optimistic update nếu có lỗi
      setPendingRequests(prev => [...prev, requestSnapshot]);
      const errorMessage = err.message || "Failed to reject request";
      setError(errorMessage);
      console.error("Error rejecting request:", errorMessage);
      return false;
    }
  }, [pendingRequests]);

  /**
   * Gửi lời mời kết bạn
   */
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

  /**
   * Hủy kết bạn (unfriend)
   */
  const unfriend = useCallback(async (friendId: string): Promise<boolean> => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("User not logged in");
      return false;
    }

    // Lưu snapshot để rollback nếu API fail
    const friendSnapshot = friends.find(f => String(f.friend.id) === String(friendId));

    // Optimistic update: cập nhật status thành "unfriended" ngay (không xóa khỏi list, chỉ đổi status)
    setFriends(prev => prev.map(f => 
      String(f.friend.id) === String(friendId) 
        ? { ...f, status: "unfriended" as any }
        : f
    ));

    try {
      setError(null);
      const response = await fetch(`/api/friends`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to unfriend");
      }

      return true;
    } catch (err: any) {
      // Rollback: khôi phục status ban đầu từ snapshot
      if (friendSnapshot) {
        setFriends(prev => prev.map(f => 
          String(f.friend.id) === String(friendId) 
            ? friendSnapshot
            : f
        ));
      }
      const errorMessage = err.message || "Failed to unfriend";
      setError(errorMessage);
      console.error("Error unfriending:", errorMessage);
      return false;
    }
  }, [getCurrentUserId, friends]);

  /**
   * Chặn user
   */
  const blockUser = useCallback(async (friendId: string): Promise<boolean> => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("User not logged in");
      return false;
    }

    // Lưu snapshot để rollback nếu API fail
    const friendSnapshot = friends.find(f => String(f.friend.id) === String(friendId));

    // Optimistic update: đổi status thành "blocked" và lưu userId vào requestedBy (để biết ai là người block)
    setFriends(prev => prev.map(f => 
      String(f.friend.id) === String(friendId) 
        ? { 
            ...f, 
            status: "blocked",
            requestedBy: { 
              id: userId, 
              username: "", 
              email: "",
              displayName: null,
              avatar: null
            }
          }
        : f
    ));

    try {
      setError(null);
      const response = await fetch(`/api/friends/block`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, blockedUserId: friendId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to block user");
      }

      return true;
    } catch (err: any) {
      // Rollback: khôi phục state ban đầu từ snapshot
      if (friendSnapshot) {
        setFriends(prev => prev.map(f => 
          String(f.friend.id) === String(friendId) 
            ? friendSnapshot
            : f
        ));
      }
      const errorMessage = err.message || "Failed to block user";
      setError(errorMessage);
      console.error("Error blocking user:", errorMessage);
      return false;
    }
  }, [getCurrentUserId, friends]);

  /**
   * Bỏ chặn user
   */
  const unblockUser = useCallback(async (friendId: string): Promise<boolean> => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("User not logged in");
      return false;
    }

    // Lưu snapshot trước khi update để rollback nếu cần
    const friendSnapshot = friends.find(f => String(f.friend.id) === String(friendId));

    // Optimistic update: cập nhật status thành "unfriended" và xóa requestedBy (người block)
    setFriends(prev => prev.map(f => 
      String(f.friend.id) === String(friendId) 
        ? { ...f, status: "unfriended" as any, requestedBy: undefined }
        : f
    ));

    try {
      setError(null);
      const response = await fetch(`/api/friends/unblock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, blockedUserId: friendId }),
      });

      if (!response.ok) {
        // Rollback nếu API fail - chỉ rollback state, không refresh
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to unblock user");
      }

      return true;
    } catch (err: any) {
      // Rollback optimistic update nếu có lỗi
      if (friendSnapshot) {
        setFriends(prev => prev.map(f => 
          String(f.friend.id) === String(friendId) 
            ? friendSnapshot
            : f
        ));
      }
      const errorMessage = err.message || "Failed to unblock user";
      setError(errorMessage);
      console.error("Error unblocking user:", errorMessage);
      return false;
    }
  }, [getCurrentUserId, friends]);

  // Auto-fetch chỉ một lần khi mount (khi userId có sẵn)
  useEffect(() => {
    // Chỉ fetch một lần duy nhất khi component mount
    if (hasFetchedRef.current) return;
    
    const userId = getCurrentUserId();
    if (userId) {
      hasFetchedRef.current = true;
      setLoading(true);
      Promise.all([fetchFriends(), fetchPendingRequests()]).finally(() => {
        setLoading(false);
      });
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
    unblockUser,
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
    unblockUser,
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

