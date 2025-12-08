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

import { memo } from "react";
import Avatar from "../../common/Avatar";
import { useToast } from "@/app/ui/toast";
import { useFriendsContext } from "@/app/contexts/FriendsContext";

interface UserProfileHeaderProps {
  userName: string;
  userEmail: string;
  userTag?: string;
  userAvatar?: string;
  friendId?: string;
  onUnfriend?: () => void;
  onBlock?: () => void;
}

// Component hiển thị profile user ở đầu danh sách tin nhắn - Memoized
const UserProfileHeader = memo(function UserProfileHeader({ 
  userName, 
  userEmail, 
  userTag,
  userAvatar,
  friendId,
  onUnfriend,
  onBlock
}: UserProfileHeaderProps) {
  const { showError, showSuccess } = useToast();
  const { unfriend, blockUser } = useFriendsContext();

  const handleUnfriend = async () => {
    if (!friendId) return;

    const success = await unfriend(friendId);
    if (success) {
      showSuccess("Đã xóa bạn thành công");
      onUnfriend?.();
    } else {
      showError("Không thể xóa bạn");
    }
  };

  const handleBlock = async () => {
    if (!friendId) return;

    const success = await blockUser(friendId);
    if (success) {
      showSuccess("Đã chặn người dùng thành công");
      onBlock?.();
    } else {
      showError("Không thể chặn người dùng");
    }
  };
  const avatarInitial = userName.charAt(0).toUpperCase();
  const userTagDisplay = userTag || userEmail.split("@")[0] || "";
  
  return (
    <div className="flex flex-col items-start">
      {/* Avatar - large */}
      <div className="w-20 h-20 mb-4">
        <Avatar
          initial={avatarInitial}
          avatarUrl={userAvatar}
          size="xl"
          className="w-20 h-20"
          shadow
        />
      </div>
      
      {/* Display name - bold and large */}
      <h3 className="text-[28px] font-bold text-[#060607]">{userName}</h3>
      
      {/* Username/tag - smaller gray text */}
      <p className="text-[20px] text-[#060607] mb-3">{userTagDisplay}</p>
      
      {/* Description text */}
      <p className="text-sm text-[#4E5058] mb-4">
        Đây là phần mở đầu trong lịch sử các tin nhắn trực tiếp của bạn với{" "}
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
        <span className="text-sm text-[#4E5058]">3 Máy Chủ Chung</span>
        
        {/* Dot separator */}
        <span className="text-[#4E5058]">•</span>
        
        {/* Xóa Bạn button - outlined style */}
        <button
          onClick={handleUnfriend}
          className="px-3 py-1.5 bg-transparent border border-[#C4C9CE] hover:bg-[#E3E5E8] text-[#4E5058] text-sm font-medium rounded-lg transition-colors"
        >
          Xóa Bạn
        </button>
        
        {/* Chặn button - outlined style */}
        <button
          onClick={handleBlock}
          className="px-3 py-1.5 bg-transparent border border-[#C4C9CE] hover:bg-[#E3E5E8] text-[#4E5058] text-sm font-medium rounded-lg transition-colors"
        >
          Chặn
        </button>
      </div>
    </div>
  );
});

UserProfileHeader.displayName = "UserProfileHeader";

export default UserProfileHeader;

