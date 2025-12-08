/**
 * Component Header của chat - Hiển thị thông tin user đang chat
 * 
 * Component này hiển thị:
 * - Avatar và tên user đang chat
 * - Icon buttons (info, search, etc.)
 */

"use client";

import { memo, useState, useRef, useEffect } from "react";
import Icon from "../../common/Icon";
import Avatar from "../../common/Avatar";
import { useToast } from "@/app/ui/toast";
import { useFriendsContext } from "@/app/contexts/FriendsContext";

interface ChatHeaderProps {
  userName: string;
  userAvatar: string;
  friendId?: string;
  onUnfriend?: () => void;
  onBlock?: () => void;
}

// Component header của chat - hiển thị avatar, tên user và các nút điều khiển - Memoized
const ChatHeader = memo(function ChatHeader({ 
  userName, 
  userAvatar,
  friendId,
  onUnfriend,
  onBlock
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showError, showSuccess } = useToast();
  const { unfriend, blockUser } = useFriendsContext();

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

  const handleUnfriend = async () => {
    setShowMenu(false);
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
    setShowMenu(false);
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
    <div className="h-12 px-4 flex items-center border-b border-[#E3E5E8] bg-[#FFFFFF] shrink-0">
      {/* Avatar và tên */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar 
          initial={userAvatar && !userAvatar.startsWith('http') ? userAvatar : userName.charAt(0).toUpperCase()} 
          avatarUrl={userAvatar && userAvatar.startsWith('http') ? userAvatar : undefined}
          size="md" 
        />
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
            title="Tùy chọn"
          >
            <Icon src="more-vertical.svg" className="w-5 h-5" size={20} />
          </button>
          {showMenu && friendId && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#FFFFFF] border border-[#E3E5E8] rounded shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={handleUnfriend}
                  className="w-full px-4 py-2 text-left text-sm text-[#060607] hover:bg-[#E3E5E8] transition-colors"
                >
                  Xóa Bạn
                </button>
                <button
                  onClick={handleBlock}
                  className="w-full px-4 py-2 text-left text-sm text-[#ED4245] hover:bg-[#E3E5E8] transition-colors"
                >
                  Chặn
                </button>
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

