/**
 * Component Sidebar bên phải - Active Now hoặc User Profile
 * 
 * Component này hiển thị:
 * - "Active Now" section khi không chat với user nào
 * - User profile khi đang chat với user
 * - Responsive design cho mobile với close button
 * - Empty state với icon và message
 */

"use client";

import { memo, useMemo } from "react";
import Icon from "../../common/Icon";
import Avatar from "../../common/Avatar";
import StatusIndicator from "../../common/StatusIndicator";
import { useUserStatusContext } from "@/app/contexts/UserStatusContext";

// Props for RightSidebar
interface RightSidebarProps {
  activeItem?: string;
  onClose?: () => void; // For mobile close button
}

// Right sidebar showing user profile when chat is active, otherwise "Active Now" - Memoized
const RightSidebar = memo(function RightSidebar({ activeItem, onClose }: RightSidebarProps) {
  const { getUserStatus } = useUserStatusContext();
  const isUserChat = activeItem?.startsWith("user-");

  // User data mapping - Memoized
  const userData = useMemo(() => ({
    "user-1": {
      name: "Hoang",
      avatar: "H",
      tag: "nchoang2004",
      joined: "31 thg 7, 2023",
      sharedServers: 4,
    },
    "user-2": {
      name: "Xuan An",
      avatar: "X",
      tag: "xuanan123",
      joined: "15 thg 5, 2023",
      sharedServers: 2,
    },
  }), []);

  const currentUser = useMemo(() => {
    return activeItem && userData[activeItem] ? userData[activeItem] : null;
  }, [activeItem, userData]);

  // If user chat is active, show user profile
  if (isUserChat && currentUser) {
    return (
      <div className="w-70 md:w-70 bg-linear-to-b from-[#F2F3F5] to-[#FFFFFF] border-l border-[#E3E5E8] shadow-2xl flex flex-col h-full">
        {/* Mobile header with close button */}
        {onClose && (
          <div className="md:hidden h-12 px-4 flex items-center border-b border-[#E3E5E8] bg-[#F2F3F5] shrink-0">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]"
              aria-label="Close sidebar"
            >
              <Icon src="arrow-left.svg" className="w-5 h-5 rotate-180" size={20} />
            </button>
            <h3 className="ml-4 text-sm font-semibold text-[#060607]">Profile</h3>
          </div>
        )}
        {/* Banner */}
        <div className="h-32 bg-linear-to-br from-[#5865F2] to-[#4752C4] relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="relative">
              <Avatar
                initial={currentUser.avatar}
                size="xl"
                className="border-4 border-[#FFFFFF]"
                shadow
              />
              <div className="absolute -bottom-0.5 -right-0.5">
                <StatusIndicator 
                  status={activeItem ? getUserStatus(activeItem.replace("user-", "")) : "offline"} 
                  size="lg" 
                  className="border-4 border-[#FFFFFF]" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-12 pb-4 px-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-[#060607] mb-1">{currentUser.name}</h3>
            <p className="text-sm text-[#747F8D]">{currentUser.tag}</p>
          </div>

          <div className="space-y-4">
            {/* Joined From */}
            <div>
              <h4 className="text-xs font-bold text-[#747F8D] uppercase tracking-wider mb-2">Gia Nhập Từ</h4>
              <p className="text-sm text-[#060607]">{currentUser.joined}</p>
            </div>

            {/* Shared Servers */}
            <div className="flex items-center justify-between cursor-pointer hover:bg-[#E3E5E8] rounded px-2 py-2 -mx-2">
              <div>
                <h4 className="text-xs font-bold text-[#747F8D] uppercase tracking-wider mb-1">Máy Chủ Chung</h4>
                <p className="text-sm text-[#060607]">{currentUser.sharedServers}</p>
              </div>
              <Icon src="arrow-left.svg" className="w-4 h-4 text-[#747F8D] rotate-180" size={16} />
            </div>
          </div>

          {/* View Full Profile Button */}
          <button className="w-full mt-6 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded transition-colors">
            Xem hồ sơ đầy đủ
          </button>
        </div>
      </div>
    );
  }

  // Default "Active Now" view
  return (
    <div className="w-70 md:w-70 bg-linear-to-b from-[#F2F3F5] to-[#FFFFFF] border-l border-[#E3E5E8] shadow-2xl flex flex-col h-full min-h-0">
      {/* Mobile header with close button */}
      {onClose && (
        <div className="md:hidden h-12 px-4 flex items-center border-b border-[#E3E5E8] bg-[#F2F3F5] shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]"
            aria-label="Close sidebar"
          >
            <Icon src="arrow-left.svg" className="w-5 h-5 rotate-180" size={20} />
          </button>
          <h3 className="ml-4 text-sm font-semibold text-[#060607]">Active Now</h3>
        </div>
      )}
      <div className="p-4 border-b border-[#E3E5E8] shrink-0">
        <h3 className="text-xs font-bold text-[#747F8D] uppercase tracking-wider mb-1">Active Now</h3>
        <p className="text-[10px] text-[#747F8D]/70">See what's happening</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
        <div className="text-center py-12">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-linear-to-r from-[#5865F2] to-[#4752C4] blur-xl opacity-10 rounded-full"></div>
            <div className="relative p-4 bg-linear-to-br from-[#F2F3F5] to-[#FFFFFF] rounded-xl border border-[#E3E5E8]">
              <Icon src="lightning.svg" className="w-16 h-16 mx-auto text-[#5865F2]/50" size={64} />
            </div>
          </div>
          <h4 className="text-sm font-semibold text-[#060607] mb-2">
            It's quiet for now...
          </h4>
          <p className="text-xs text-[#747F8D] leading-relaxed mb-4">
            When a friend starts an activity—like playing a game or hanging out on voice—we'll show it here!
          </p>
          <div className="space-y-2">
            <div className="h-1 bg-[#E3E5E8] rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-[#5865F2] to-[#4752C4] rounded-full w-0 animate-pulse"></div>
            </div>
            <p className="text-[10px] text-[#747F8D]/50">
              Waiting for activity...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

RightSidebar.displayName = "RightSidebar";

export default RightSidebar;

