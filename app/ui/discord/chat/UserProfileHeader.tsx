/**
 * Component Header hiển thị profile của user trong RightSidebar
 * 
 * Component này hiển thị:
 * - Avatar lớn của user
 * - Username và tag
 * - Email
 * - Divider và các thông tin khác
 */

"use client";

import { memo, useEffect, useState, useCallback, useMemo } from "react";
import Avatar from "../../common/Avatar";
import { useToast } from "@/app/ui/toast";
import { useFriendsContext } from "@/app/contexts/FriendsContext";

interface UserProfileHeaderProps {
  userName: string;
  userEmail: string;
  userTag?: string;
  userUsername?: string; // Username của user
  userAvatar?: string;
  friendId?: string;
  onUnfriend?: () => void;
  onBlock?: () => void;
  onAddFriend?: () => void; // Callback khi gửi friend request thành công
}

// Component hiển thị profile user ở đầu danh sách tin nhắn - Memoized
const UserProfileHeader = memo(function UserProfileHeader({ 
  userName, 
  userEmail, 
  userTag,
  userUsername,
  userAvatar,
  friendId,
  onUnfriend,
  onBlock,
  onAddFriend
}: UserProfileHeaderProps) {
  const { showError, showSuccess } = useToast();
  const { unfriend, blockUser, unblockUser, sendFriendRequest, acceptRequest, rejectRequest } = useFriendsContext();
  
  // State để lưu friendship status từ DB
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [requestedBy, setRequestedBy] = useState<string | null>(null);
  const [blockedBy, setBlockedBy] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  /**
   * Làm mới trạng thái kết bạn từ API
   */
  const refreshFriendshipStatus = useCallback(async () => {
    if (!friendId || !currentUserId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/friends/status?userId1=${currentUserId}&userId2=${friendId}`, {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        setFriendshipStatus(data.status);
        setFriendshipId(data.friendshipId);
        setRequestedBy(data.requestedBy);
        setBlockedBy(data.blockedBy);
      }
    } catch (error) {
      console.error("Error fetching friendship status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [friendId, currentUserId]);

  // Fetch friendship status từ DB khi mount hoặc friendId thay đổi
  useEffect(() => {
    refreshFriendshipStatus();
  }, [refreshFriendshipStatus]);

  // Kiểm tra current user có phải người block không (để hiển thị nút "Unblock" cho người block, ẩn cho người bị block)
  const isCurrentUserBlocked = useMemo(() => 
    friendshipStatus === "blocked" && blockedBy === currentUserId,
    [friendshipStatus, blockedBy, currentUserId]
  );
  // Kiểm tra current user có phải người gửi request không (để hiển thị "Friend Request Sent" thay vì "Add Friend")
  const isRequestSentByCurrentUser = useMemo(() => 
    friendshipStatus === "pending" && requestedBy === currentUserId,
    [friendshipStatus, requestedBy, currentUserId]
  );
  // Kiểm tra có phải incoming request không (người khác gửi cho mình, để hiển thị "Accept/Decline")
  const isIncomingRequest = useMemo(() => 
    friendshipStatus === "pending" && requestedBy !== currentUserId && requestedBy !== null,
    [friendshipStatus, requestedBy, currentUserId]
  );

  /**
   * Xử lý hành động hủy kết bạn
   */
  const handleUnfriend = useCallback(async () => {
    if (!friendId) return;

    const success = await unfriend(friendId);
    if (success) {
      showSuccess("Friend removed successfully");
      await refreshFriendshipStatus();
      onUnfriend?.();
    } else {
      showError("Unable to remove friend");
    }
  }, [friendId, unfriend, refreshFriendshipStatus, showSuccess, showError, onUnfriend]);

  /**
   * Xử lý hành động chặn/bỏ chặn user
   */
  const handleBlock = useCallback(async () => {
    if (!friendId) return;

    // Nếu đã bị chặn và current user là người block, unblock
    if (friendshipStatus === "blocked" && isCurrentUserBlocked) {
      const success = await unblockUser(friendId);
      if (success) {
        showSuccess("User unblocked successfully");
        await refreshFriendshipStatus();
        onBlock?.();
      } else {
        showError("Unable to unblock user");
      }
    } else if (friendshipStatus !== "blocked") {
      // Chỉ cho phép block nếu chưa bị block
      const success = await blockUser(friendId);
      if (success) {
        showSuccess("User blocked successfully");
        await refreshFriendshipStatus();
        onBlock?.();
      } else {
        showError("Unable to block user");
      }
    }
  }, [friendId, friendshipStatus, isCurrentUserBlocked, unblockUser, blockUser, refreshFriendshipStatus, showSuccess, showError, onBlock]);

  /**
   * Xử lý gửi lời mời kết bạn
   */
  const handleAddFriend = useCallback(async () => {
    if (!friendId) return;

    const success = await sendFriendRequest(friendId);
    if (success) {
      showSuccess("Friend request sent!");
      await refreshFriendshipStatus();
      onAddFriend?.();
    } else {
      showError("Unable to send friend request");
    }
  }, [friendId, sendFriendRequest, refreshFriendshipStatus, showSuccess, showError, onAddFriend]);

  /**
   * Xử lý chấp nhận lời mời kết bạn
   */
  const handleAcceptRequest = useCallback(async () => {
    if (!friendshipId) return;

    const success = await acceptRequest(friendshipId);
    if (success) {
      showSuccess("Friend request accepted!");
      await refreshFriendshipStatus();
      onAddFriend?.();
    } else {
      showError("Unable to accept friend request");
    }
  }, [friendshipId, acceptRequest, refreshFriendshipStatus, showSuccess, showError, onAddFriend]);

  /**
   * Xử lý từ chối lời mời kết bạn
   */
  const handleRejectRequest = useCallback(async () => {
    if (!friendshipId) return;

    const success = await rejectRequest(friendshipId);
    if (success) {
      showSuccess("Friend request declined");
      await refreshFriendshipStatus();
      onAddFriend?.();
    } else {
      showError("Unable to decline friend request");
    }
  }, [friendshipId, rejectRequest, refreshFriendshipStatus, showSuccess, showError, onAddFriend]);
  /**
   * Định dạng URL avatar
   */
  const getAvatarUrl = () => {
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
  };

  const avatarInitial = userName.charAt(0).toUpperCase();
  const avatarUrl = getAvatarUrl();
  
  return (
    <div className="flex flex-col items-start">
      {/* Avatar - large */}
      <div className="w-20 h-20 mb-4">
        <Avatar
          initial={avatarInitial}
          avatarUrl={avatarUrl}
          size="xl"
          className="w-20 h-20"
          shadow
        />
      </div>
      
      {/* Display name - bold and large */}
      <h3 className="text-[28px] font-bold text-[#060607]">{userName}</h3>
      
      {/* Username - smaller gray text */}
      <p className="text-[20px] text-[#060607] mb-3">{userUsername || userEmail.split("@")[0] || ""}</p>
      
      {/* Description text */}
      <p className="text-sm text-[#4E5058] mb-4">
        This is the beginning of your direct message history with{" "}
        <span className="font-semibold">{userName}</span>.
      </p>
      
      {/* Bottom row: mutual servers + buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Mutual servers avatars */}
        <div className="flex items-center">
          <div className="flex -space-x-1">
            <div className="w-5 h-5 rounded-full bg-[#5865F2] border-2 border-white" />
            <div className="w-5 h-5 rounded-full bg-[#ED4245] border-2 border-white" />
          </div>
        </div>
        
        {/* Mutual servers text */}
        <span className="text-sm text-[#4E5058]">3 Mutual Servers</span>
        
        {/* Dot separator */}
        <span className="text-[#4E5058]">•</span>
        
        {/* Unfriend / Add Friend / Accept/Decline buttons */}
        {isLoading ? (
          <div className="px-3 py-1.5 text-sm text-[#747F8D]">Loading...</div>
        ) : friendshipStatus === "blocked" ? (
          // Khi bị block: chỉ user block mới thấy nút Unblock, user bị block không thấy gì
          isCurrentUserBlocked ? (
            <button
              onClick={handleBlock}
              className="px-3 py-1.5 bg-transparent border border-[#C4C9CE] hover:bg-[#E3E5E8] text-[#4E5058] text-sm font-medium rounded-lg transition-colors"
            >
              Unblock
            </button>
          ) : null
        ) : friendshipStatus === "accepted" ? (
          // Khi đã là bạn bè, hiển thị cả Unfriend và Block
          <>
            <button
              onClick={handleUnfriend}
              className="px-3 py-1.5 bg-transparent border border-[#C4C9CE] hover:bg-[#E3E5E8] text-[#4E5058] text-sm font-medium rounded-lg transition-colors"
            >
              Unfriend
            </button>
            <button
              onClick={handleBlock}
              className="px-3 py-1.5 bg-transparent border border-[#C4C9CE] hover:bg-[#E3E5E8] text-[#4E5058] text-sm font-medium rounded-lg transition-colors"
            >
              Block
            </button>
          </>
        ) : isIncomingRequest ? (
          // Hiển thị Accept và Decline khi có incoming request
          <>
            <button
              onClick={handleAcceptRequest}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-[#23A559] hover:bg-[#1E8E4A] rounded-lg transition-colors"
            >
              Accept
            </button>
            <button
              onClick={handleRejectRequest}
              className="px-3 py-1.5 text-sm font-semibold text-[#060607] bg-[#E3E5E8] hover:bg-[#D1D9DE] rounded-lg transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleBlock}
              className="px-3 py-1.5 bg-transparent border border-[#C4C9CE] hover:bg-[#E3E5E8] text-[#4E5058] text-sm font-medium rounded-lg transition-colors"
            >
              Block
            </button>
          </>
        ) : isRequestSentByCurrentUser ? (
          <button
            disabled
            className="px-3 py-1.5 bg-transparent border border-[#C4C9CE] text-[#747F8D] text-sm font-medium rounded-lg cursor-not-allowed opacity-60"
          >
            Friend Request Sent
          </button>
        ) : (
          <button
            onClick={handleAddFriend}
            className="px-3 py-1.5 bg-transparent border border-[#C4C9CE] hover:bg-[#E3E5E8] text-[#4E5058] text-sm font-medium rounded-lg transition-colors"
          >
            Add Friend
          </button>
        )}
      </div>
    </div>
  );
});

UserProfileHeader.displayName = "UserProfileHeader";

export default UserProfileHeader;

