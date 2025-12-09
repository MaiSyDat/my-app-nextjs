/**
 * Component Modal để thêm bạn bè
 * 
 * Component này:
 * - Hiển thị input để tìm kiếm user
 * - Search users theo username hoặc email
 * - Hiển thị kết quả search với button "Add Friend"
 * - Gửi friend request qua API
 * - Hiển thị toast notification khi thành công/lỗi
 * - Close modal khi click outside hoặc ESC
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Icon from "../../common/Icon";
import Avatar from "../../common/Avatar";
import StatusIndicator from "../../common/StatusIndicator";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useToast } from "@/app/ui/toast";
import { useFriendsContext } from "@/app/contexts/FriendsContext";
import { useUserStatusContext } from "@/app/contexts/UserStatusContext";

// Props
interface AddFriendModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

// Component modal tìm kiếm và kết bạn
export default function AddFriendModal({ onClose, onSuccess }: AddFriendModalProps) {
  const { getUserStatus } = useUserStatusContext();
  
  // State quản lý search input
  const [searchQuery, setSearchQuery] = useState("");
  // State lưu kết quả tìm kiếm
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    username: string;
    email: string;
    displayName?: string | null;
    avatar?: string | null;
    friendshipStatus?: string | null;
    requestedBy?: string | null;
  }>>([]);
  // State loading
  const [isSearching, setIsSearching] = useState(false);
  // State lưu thông tin user hiện tại
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // State lưu trạng thái gửi lời mời (để hiển thị feedback)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  // Sử dụng toast để hiển thị thông báo
  const { showSuccess, showError } = useToast();
  
  // Sử dụng FriendsContext để gửi friend request
  const { sendFriendRequest } = useFriendsContext();

  // Lấy currentUserId từ localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUserId(parsedUser.id);
      } catch (error) {
        // Silent fail
      }
    }
  }, []);

  // Tìm kiếm user khi searchQuery thay đổi (debounce)
  useEffect(() => {
    if (!searchQuery.trim() || !currentUserId) {
      setSearchResults([]);
      return;
    }

    // Debounce search - tối ưu với AbortController để cancel request cũ
    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery.trim())}&currentUserId=${currentUserId}`,
          { signal: abortController.signal, cache: 'no-store' }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        } else {
          setSearchResults([]);
        }
      } catch (error: any) {
        // Ignore abort errors
        if (error.name !== 'AbortError') {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery, currentUserId]);

  /**
   * Gửi lời mời kết bạn
   */
  const handleSendFriendRequest = useCallback(async (friendId: string) => {
    if (!currentUserId) return;

    setSendingRequest(friendId);
    try {
      const success = await sendFriendRequest(friendId);
      
      if (success) {
        // Thành công - cập nhật trạng thái thành "pending" trong local state
        showSuccess("Friend request sent!");
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === friendId
              ? { ...user, friendshipStatus: "pending", requestedBy: currentUserId }
              : user
          )
        );
        onSuccess?.();
      } else {
        showError("Unable to send friend request");
      }
    } catch (error: any) {
      // Nếu lỗi là "already sent", cập nhật local state
      if (error.message?.includes("already sent")) {
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === friendId
              ? { ...user, friendshipStatus: "pending", requestedBy: currentUserId }
              : user
          )
        );
      }
      showError(error.message || "An error occurred while sending friend request");
    } finally {
      setSendingRequest(null);
    }
  }, [currentUserId, sendFriendRequest, showSuccess, showError, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-[440px] bg-[#FFFFFF] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E3E5E8] bg-[#F7F8F9]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#060607]">Add Friend</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
          <p className="text-sm text-[#747F8D] mt-1">
            You can send a friend request using username or email.
          </p>
        </div>

        {/* Search Input và Results - Chiều cao cố định */}
        <div className="p-6 flex flex-col h-[400px]">
          <div className="relative shrink-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon src="search.svg" className="w-5 h-5 text-[#747F8D]" size={20} />
            </div>
            <input
              type="text"
              placeholder="Enter username or email to search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8F9] border border-[#E3E5E8] rounded-lg text-sm text-[#060607] placeholder-[#747F8D] focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] transition-all"
              autoFocus
            />
          </div>

          {/* Search Results - Chiều cao cố định với scroll */}
          <div className="mt-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {searchQuery.trim() ? (
              <>
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-sm text-[#747F8D]">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((user) => {
                      // Kiểm tra trạng thái friendship
                      const isFriend = user.friendshipStatus === "accepted";
                      const isPending = user.friendshipStatus === "pending";
                      const isRequestedByMe = isPending && user.requestedBy === currentUserId;
                      const isRequestedByThem = isPending && user.requestedBy !== currentUserId;
                      
                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F7F8F9] transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Avatar với status indicator */}
                            <div className="relative shrink-0">
                              <Avatar
                                initial={(user.displayName || user.username).charAt(0).toUpperCase()}
                                avatarUrl={user.avatar || undefined}
                                size="lg"
                              />
                              <div className="absolute -bottom-0.5 -right-0.5">
                                <StatusIndicator status={getUserStatus(user.id)} size="lg" />
                              </div>
                            </div>
                            {/* Thông tin user */}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[#060607] text-sm truncate">
                                {user.displayName || user.username}
                              </div>
                              <div className="text-xs text-[#747F8D] truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>
                          {/* Hiển thị trạng thái hoặc nút gửi lời mời */}
                          {isFriend ? (
                            <span className="px-4 py-1.5 text-sm font-medium text-[#747F8D] bg-[#F7F8F9] rounded-lg shrink-0">
                              Friends
                            </span>
                          ) : isRequestedByMe ? (
                            <span className="px-4 py-1.5 text-sm font-medium text-[#747F8D] bg-[#F7F8F9] rounded-lg shrink-0">
                              Friend Request Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(user.id)}
                              disabled={sendingRequest === user.id || isRequestedByThem}
                              className="px-4 py-1.5 text-sm font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                              {sendingRequest === user.id ? "Sending..." : "Send Request"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#747F8D]">No users found.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                <div className="mb-4">
                  <Icon
                    src="search.svg"
                    className="w-12 h-12 mx-auto text-[#747F8D] opacity-50"
                    size={48}
                  />
                </div>
                <p className="text-sm text-[#747F8D]">
                  Enter username or email to search for friends
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E3E5E8] bg-[#F7F8F9]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-[#060607] bg-[#E3E5E8] hover:bg-[#D1D9DE] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

