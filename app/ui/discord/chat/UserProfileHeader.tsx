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
import Icon from "../../common/Icon";
import { useToast } from "@/app/ui/toast";
import { useFriendsContext } from "@/app/contexts/FriendsContext";

interface UserProfileHeaderProps {
  userName: string;
  userEmail: string;
  userTag?: string;
  friendId?: string;
  onUnfriend?: () => void;
  onBlock?: () => void;
}

// Component hiển thị profile user ở đầu danh sách tin nhắn - Memoized
const UserProfileHeader = memo(function UserProfileHeader({ 
  userName, 
  userEmail, 
  userTag,
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
  return (
    <div className="flex flex-col items-center py-8 mb-4">
      <div className="w-20 h-20 rounded-full bg-[#ED4245] flex items-center justify-center mb-4 shadow-lg">
        <Icon
          src="discord.svg"
          className="w-12 h-12 text-white"
          size={48}
        />
      </div>
      <h3 className="text-2xl font-bold text-[#060607] mb-1">
        {userName}
      </h3>
      <p className="text-sm text-[#747F8D] mb-4">{userEmail.split("@")[0] || userTag}</p>
      <p className="text-sm text-[#747F8D] text-center max-w-md mb-6">
        Đây là phần mở đầu trong lịch sử các tin nhắn trực tiếp của bạn
        với {userName}.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-md">
        <div className="flex items-center gap-2 px-4 py-2 hover:bg-[#E3E5E8] rounded cursor-pointer transition-colors">
          <Icon
            src="friends.svg"
            className="w-5 h-5 text-[#747F8D]"
            size={20}
          />
          <span className="text-sm text-[#060607]">
            0 Máy Chủ Chung
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleUnfriend}
            className="flex-1 px-4 py-2 bg-[#E3E5E8] hover:bg-[#D1D9DE] text-[#060607] text-sm font-medium rounded transition-colors"
          >
            Xóa Bạn
          </button>
          <button 
            onClick={handleBlock}
            className="flex-1 px-4 py-2 bg-[#E3E5E8] hover:bg-[#D1D9DE] text-[#060607] text-sm font-medium rounded transition-colors"
          >
            Chặn
          </button>
        </div>
      </div>
    </div>
  );
});

UserProfileHeader.displayName = "UserProfileHeader";

export default UserProfileHeader;

