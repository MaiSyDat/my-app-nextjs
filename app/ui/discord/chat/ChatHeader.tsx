/**
 * Component Header của chat - Hiển thị thông tin user đang chat
 * 
 * Component này hiển thị:
 * - Avatar và tên user đang chat
 * - Icon buttons (info, search, etc.)
 */

"use client";

import { memo } from "react";
import Icon from "../../common/Icon";
import Avatar from "../../common/Avatar";

interface ChatHeaderProps {
  userName: string;
  userAvatar: string;
}

// Component header của chat - hiển thị avatar, tên user và các nút điều khiển - Memoized
const ChatHeader = memo(function ChatHeader({ userName, userAvatar }: ChatHeaderProps) {
  return (
    <div className="h-12 px-4 flex items-center border-b border-[#E3E5E8] bg-[#FFFFFF] shrink-0">
      {/* Avatar và tên */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar initial={userAvatar} size="md" />
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
      </div>
    </div>
  );
});

ChatHeader.displayName = "ChatHeader";

export default ChatHeader;

