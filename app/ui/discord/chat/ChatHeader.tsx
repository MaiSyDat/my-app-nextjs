/**
 * Component Header của chat - Hiển thị thông tin user đang chat
 * 
 * Component này hiển thị:
 * - Avatar và tên user đang chat
 * - Icon buttons (info, search, etc.)
 */

"use client";

import { memo, useState, useRef, useEffect, useMemo, useCallback } from "react";
import Icon from "../../common/Icon";
import Avatar from "../../common/Avatar";
import StatusIndicator from "../../common/StatusIndicator";
import { useToast } from "@/app/ui/toast";
import { useFriendsContext } from "@/app/contexts/FriendsContext";
import { useUserStatusContext } from "@/app/contexts/UserStatusContext";

interface ChatHeaderProps {
  userName: string;
  userAvatar: string;
  friendId?: string;
  friendshipStatus?: string; // Thêm friendship status
  requestedBy?: string | null; // ID của người đã gửi friend request (nếu status là pending) hoặc người block (nếu status là blocked)
  blockedBy?: string | null; // ID của người đã block (nếu bị block)
  onUnfriend?: () => void;
  onBlock?: () => void;
}

// Component header của chat - hiển thị avatar, tên user và các nút điều khiển - Memoized
const ChatHeader = memo(function ChatHeader({ 
  userName, 
  userAvatar,
  friendId,
  friendshipStatus,
  requestedBy,
  blockedBy,
  onUnfriend,
  onBlock
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showError, showSuccess } = useToast();
  const { unfriend, blockUser, unblockUser, sendFriendRequest } = useFriendsContext();
  const { getUserStatus } = useUserStatusContext();
  
  /**
   * Lấy ID của user hiện tại từ localStorage
   */
  const currentUserId = useMemo(() => {
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

  // Tính toán các trạng thái - memoized
  const isRequestSentByCurrentUser = useMemo(() => 
    friendshipStatus === "pending" && requestedBy === currentUserId,
    [friendshipStatus, requestedBy, currentUserId]
  );
  const isCurrentUserBlocked = useMemo(() => 
    friendshipStatus === "blocked" && (blockedBy === currentUserId || requestedBy === currentUserId),
    [friendshipStatus, blockedBy, requestedBy, currentUserId]
  );

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  /**
   * Xử lý hành động hủy kết bạn
   */
  const handleUnfriend = useCallback(async () => {
    setShowMenu(false);
    if (!friendId) return;

    const success = await unfriend(friendId);
    if (success) {
      showSuccess("Friend removed successfully");
      onUnfriend?.();
    } else {
      showError("Unable to remove friend");
    }
  }, [friendId, unfriend, showSuccess, showError, onUnfriend]);

  /**
   * Xử lý hành động chặn/bỏ chặn user
   */
  const handleBlock = useCallback(async () => {
    setShowMenu(false);
    if (!friendId) return;

    // Nếu đã bị chặn và current user là người block, unblock
    if (friendshipStatus === "blocked" && isCurrentUserBlocked) {
      const success = await unblockUser(friendId);
      if (success) {
        showSuccess("User unblocked successfully");
        onBlock?.();
      } else {
        showError("Unable to unblock user");
      }
    } else if (friendshipStatus !== "blocked") {
      // Chỉ cho phép block nếu chưa bị block
      const success = await blockUser(friendId);
      if (success) {
        showSuccess("User blocked successfully");
        onBlock?.();
      } else {
        showError("Unable to block user");
      }
    }
  }, [friendId, friendshipStatus, isCurrentUserBlocked, unblockUser, blockUser, showSuccess, showError, onBlock]);

  /**
   * Xử lý gửi lời mời kết bạn
   */
  const handleAddFriend = useCallback(async () => {
    setShowMenu(false);
    if (!friendId) return;

    const success = await sendFriendRequest(friendId);
    if (success) {
      showSuccess("Friend request sent!");
      onUnfriend?.();
    } else {
      showError("Unable to send friend request");
    }
  }, [friendId, sendFriendRequest, showSuccess, showError, onUnfriend]);
  /**
   * Định dạng URL avatar
   */
  const avatarUrl = useMemo(() => {
    if (!userAvatar) return undefined;
    // Nếu đã là URL đầy đủ (http/https)
    if (userAvatar.startsWith('http://') || userAvatar.startsWith('https://')) {
      return userAvatar;
    }
    // Nếu là đường dẫn file (bắt đầu bằng /)
    if (userAvatar.startsWith('/')) {
      return userAvatar;
    }
    // Nếu là đường dẫn tương đối (không bắt đầu bằng /)
    if (userAvatar.includes('/')) {
      return `/${userAvatar}`;
    }
    // Nếu không phải URL hợp lệ, trả về undefined để dùng initial
    return undefined;
  }, [userAvatar]);

  const avatarInitial = useMemo(() => userName.charAt(0).toUpperCase(), [userName]);

  return (
    <div className="h-12 px-4 flex items-center border-b border-[#E3E5E8] bg-[#FFFFFF] shrink-0">
      {/* Avatar và tên */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative shrink-0">
          <Avatar 
            initial={avatarInitial} 
            avatarUrl={avatarUrl}
            size="md" 
          />
          {friendId && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusIndicator status={getUserStatus(friendId)} size="md" />
            </div>
          )}
        </div>
        <h2 className="text-base font-semibold text-[#060607] truncate">
          {userName}
        </h2>
      </div>
      
      {/* Các nút điều khiển - call, video, pin, search... */}
      <div className="flex items-center gap-1">
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]">
          <Icon src="phone.svg" className="w-5 h-5" size={20} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]">
          <Icon src="video.svg" className="w-5 h-5" size={20} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]">
          <Icon src="pin.svg" className="w-5 h-5" size={20} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]">
          <Icon src="friends.svg" className="w-5 h-5" size={20} />
        </button>
        <div className="w-px h-6 bg-[#E3E5E8] mx-1"></div>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]">
          <Icon src="search.svg" className="w-4 h-4" size={16} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]">
          <Icon src="help.svg" className="w-5 h-5" size={20} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]">
          <Icon src="lightning.svg" className="w-5 h-5" size={20} />
        </button>
        {/* Menu dropdown */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]"
            title="Options"
          >
            <Icon src="more-vertical.svg" className="w-5 h-5" size={20} />
          </button>
          {showMenu && friendId && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#FFFFFF] border border-[#E3E5E8] rounded shadow-lg z-50">
              <div className="py-1">
                {friendshipStatus === "accepted" ? (
                  <>
                    <button
                      onClick={handleUnfriend}
                      className="w-full px-4 py-2 text-left text-sm text-[#060607] hover:bg-[#E3E5E8] transition-colors"
                    >
                      Unfriend
                    </button>
                    <button
                      onClick={handleBlock}
                      className="w-full px-4 py-2 text-left text-sm text-[#ED4245] hover:bg-[#E3E5E8] transition-colors"
                    >
                      Block
                    </button>
                  </>
                ) : friendshipStatus === "blocked" && isCurrentUserBlocked ? (
                  <button
                    onClick={handleBlock}
                    className="w-full px-4 py-2 text-left text-sm text-[#060607] hover:bg-[#E3E5E8] transition-colors"
                  >
                    Unblock
                  </button>
                ) : isRequestSentByCurrentUser ? (
                  <div className="w-full px-4 py-2 text-sm text-[#747F8D] cursor-not-allowed">
                    Friend Request Sent
                  </div>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    className="w-full px-4 py-2 text-left text-sm text-[#060607] hover:bg-[#E3E5E8] transition-colors"
                  >
                    Add Friend
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatHeader.displayName = "ChatHeader";

export default ChatHeader;

