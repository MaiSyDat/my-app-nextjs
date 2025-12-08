/**
 * Component TopBar - Thanh bar cố định ở trên cùng
 * 
 * Component này hiển thị:
 * - Title của section hiện tại
 * - Toggle buttons cho mobile (channel sidebar và right sidebar)
 * - Responsive design với conditional rendering
 */

"use client";

import { memo, useMemo, useCallback } from "react";
import Icon from "../../common/Icon";

// Props for TopBar
interface TopBarProps {
  title: string;
  onToggleChannelSidebar?: () => void;
  onToggleRightSidebar?: () => void;
}

// Top bar cố định ở trên đầu Discord interface - Memoized
const TopBar = memo(function TopBar({ title, onToggleChannelSidebar, onToggleRightSidebar }: TopBarProps) {
  // Map title để hiển thị đúng tên - memoized
  const displayTitle = useMemo(() => {
    // Check if it's a user chat
    if (title.startsWith("user-")) {
      return "Tin nhắn trực tiếp";
    }
    const titleMap: { [key: string]: string } = {
      friends: "Bạn bè",
      nitro: "Nitro",
      shop: "Shop",
    };
    return titleMap[title] || title;
  }, [title]);

  return (
    <div className="h-12 px-2 md:px-4 bg-[#F2F3F5] border-b border-[#E3E5E8] flex items-center justify-between shrink-0 shadow-lg z-10 relative">
      {/* Left side: Mobile menu button (chỉ hiện trên mobile) */}
      <div className="flex items-center gap-1 md:hidden">
        {onToggleChannelSidebar && (
          <button
            onClick={onToggleChannelSidebar}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]"
            aria-label="Toggle menu"
          >
            <Icon src="menu.svg" className="w-5 h-5" size={20} />
          </button>
        )}
      </div>

      {/* Center: Icon và Title căn giữa */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 justify-center">
        <Icon
          src="quick-switcher.svg"
          className="w-4 h-4 text-sm shrink-0"
          size={16}
        />
        <div className="text-[12px] font-medium text-[#2E3338] truncate max-w-[150px] md:max-w-none">
          {displayTitle}
        </div>
      </div>

      {/* Right side: Inbox, Help buttons và mobile right sidebar toggle */}
      <div className="flex items-center gap-1 flex-1 justify-end">
        {/* Inbox button - ẩn trên mobile */}
        <button
          className="hidden md:flex w-8 h-8 items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]"
          aria-label="Hộp thư đến"
          role="button"
          tabIndex={0}
        >
          <Icon src="inbox.svg" className="w-6 h-6" size={24} />
        </button>

        {/* Help button - ẩn trên mobile */}
        <a
          href="https://support.discord.com"
          rel="noreferrer noopener"
          target="_blank"
          className="hidden md:flex w-8 h-8 items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]"
          aria-label="Trợ giúp"
          tabIndex={0}
        >
          <Icon src="help.svg" className="w-6 h-6" size={24} />
        </a>

        {/* Mobile right sidebar toggle */}
        {onToggleRightSidebar && (
          <button
            onClick={onToggleRightSidebar}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]"
            aria-label="Toggle right sidebar"
          >
            <Icon src="user.svg" className="w-5 h-5" size={20} />
          </button>
        )}
      </div>
    </div>
  );
});

TopBar.displayName = "TopBar";

export default TopBar;

