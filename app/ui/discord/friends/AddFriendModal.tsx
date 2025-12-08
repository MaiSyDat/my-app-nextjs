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
import LoadingSpinner from "../../common/LoadingSpinner";
import { useToast } from "@/app/ui/toast";
import { useFriendsContext } from "@/app/contexts/FriendsContext";

// Props
interface AddFriendModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

// Component modal tìm kiếm và kết bạn
export default function AddFriendModal({ onClose, onSuccess }: AddFriendModalProps) {
  // State quản lý search input
  const [searchQuery, setSearchQuery] = useState("");
  // State lưu kết quả tìm kiếm
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    username: string;
    email: string;
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

  // Hàm gửi lời mời kết bạn - sử dụng context
  const handleSendFriendRequest = useCallback(async (friendId: string) => {
    if (!currentUserId) return;

    setSendingRequest(friendId);
    try {
      const success = await sendFriendRequest(friendId);
      
      if (success) {
        // Thành công - cập nhật trạng thái thành "pending"
        showSuccess("Đã gửi lời mời kết bạn!");
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === friendId
              ? { ...user, friendshipStatus: "pending", requestedBy: currentUserId }
              : user
          )
        );
        onSuccess?.();
      } else {
        // Lỗi đã được xử lý trong context, chỉ cần hiển thị thông báo chung
        showError("Không thể gửi lời mời kết bạn");
      }
    } catch (error) {
      showError("Có lỗi xảy ra khi gửi lời mời");
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
            <h2 className="text-xl font-semibold text-[#060607]">Thêm Bạn Bè</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
          <p className="text-sm text-[#747F8D] mt-1">
            Bạn có thể gửi lời mời kết bạn bằng username hoặc email.
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
              placeholder="Nhập username hoặc email để tìm kiếm"
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
                    <span className="ml-3 text-sm text-[#747F8D]">Đang tìm kiếm...</span>
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
                            {/* Avatar */}
                            <Avatar
                              initial={user.username.charAt(0)}
                              size="lg"
                            />
                            {/* Thông tin user */}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[#060607] text-sm truncate">
                                {user.username}
                              </div>
                              <div className="text-xs text-[#747F8D] truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>
                          {/* Hiển thị trạng thái hoặc nút gửi lời mời */}
                          {isFriend ? (
                            <span className="px-4 py-1.5 text-sm font-medium text-[#747F8D] bg-[#F7F8F9] rounded-lg shrink-0">
                              Bạn bè
                            </span>
                          ) : isRequestedByMe ? (
                            <span className="px-4 py-1.5 text-sm font-medium text-[#747F8D] bg-[#F7F8F9] rounded-lg shrink-0">
                              Đã gửi lời mời
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(user.id)}
                              disabled={sendingRequest === user.id || isRequestedByThem}
                              className="px-4 py-1.5 text-sm font-semibold text-white bg-linear-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3C45A5] rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                              {sendingRequest === user.id ? "Đang gửi..." : "Gửi lời mời"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#747F8D]">Không tìm thấy người dùng nào.</p>
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
                  Nhập username hoặc email để tìm kiếm bạn bè
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
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

