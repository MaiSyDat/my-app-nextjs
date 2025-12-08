/**
 * Layout chính của ứng dụng Discord
 * 
 * Layout này bao gồm:
 * - TopBar: Thanh bar cố định ở trên cùng
 * - ServerList: Danh sách server bên trái (ẩn trên mobile)
 * - ChannelSidebar: Sidebar channels và Direct Messages
 * - MessageArea: Vùng hiển thị tin nhắn hoặc Friends view
 * - RightSidebar: Sidebar bên phải (Active Now hoặc profile)
 * - SettingsModal: Modal cài đặt
 * - Responsive design cho mobile với overlay và toggle buttons
 * - UnreadMessagesProvider: Context provider cho unread messages
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import ServerList from "./ServerList";
import ChannelSidebar from "./ChannelSidebar";
import MessageArea from "../chat/MessageArea";
import RightSidebar from "./RightSidebar";
import TopBar from "./TopBar";
import Icon from "../../common/Icon";
import { UnreadMessagesProvider } from "@/app/contexts/UnreadMessagesContext";
import { UserStatusProvider } from "@/app/contexts/UserStatusContext";
import { FriendsProvider } from "@/app/contexts/FriendsContext";
import { useUserStatus } from "@/app/hooks/useUserStatus";

// Lazy load SettingsModal để tối ưu performance
const SettingsModal = dynamic(() => import("../settings/SettingsModal"), {
  ssr: false,
});

// Layout chính của Discord - 3 cột, top bar và settings modal
function DiscordLayoutContent() {
  // Theo dõi trạng thái của user hiện tại
  useUserStatus();

  // State quản lý modal settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // State quản lý item đang được chọn (friends, nitro, shop, user-1, user-2...)
  const [activeItem, setActiveItem] = useState<string>("friends");
  
  // State quản lý responsive: mobile menu và sidebars
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showChannelSidebar, setShowChannelSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowChannelSidebar(false);
        setShowRightSidebar(false);
      } else {
        setShowChannelSidebar(true);
        setShowRightSidebar(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Memoize handlers để tránh re-render không cần thiết
  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleActiveItemChange = useCallback((item: string) => {
    setActiveItem(item);
    // Trên mobile, đóng channel sidebar khi chọn chat
    if (isMobile && item.startsWith("user-")) {
      setShowChannelSidebar(false);
    }
  }, [isMobile]);

  const toggleChannelSidebar = useCallback(() => {
    setShowChannelSidebar((prev) => !prev);
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setShowRightSidebar((prev) => !prev);
  }, []);

  // Memoize title để tránh re-render TopBar không cần thiết
  const displayTitle = useMemo(() => {
    if (activeItem.startsWith("user-")) {
      return "Tin nhắn trực tiếp";
    }
    const titleMap: { [key: string]: string } = {
      friends: "Bạn bè",
      nitro: "Nitro",
      shop: "Shop",
    };
    return titleMap[activeItem] || activeItem;
  }, [activeItem]);

  return (
    <FriendsProvider>
      <UnreadMessagesProvider>
      {/* Container chính - full screen với gradient background */}
      <div className="flex h-screen bg-linear-to-br from-[#FFFFFF] via-[#F7F8F9] to-[#F2F3F5] text-[#060607] overflow-hidden flex-col">
        {/* Top bar - thanh bar cố định ở trên */}
        <TopBar 
          title={activeItem} 
          onToggleChannelSidebar={isMobile ? toggleChannelSidebar : undefined}
          onToggleRightSidebar={isMobile ? toggleRightSidebar : undefined}
        />

        {/* Vùng nội dung chính - 3 cột */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* Cột 1: Danh sách server - ẩn trên mobile */}
          <div className={`${isMobile ? "hidden" : "block"} shrink-0`}>
            <ServerList />
          </div>

          {/* Cột 2: Sidebar channels + vùng tin nhắn */}
          <div className="flex flex-1 min-w-0 relative">
            {/* Sidebar channels - danh sách bạn bè, DM */}
            <div
              className={`${
                showChannelSidebar
                  ? "translate-x-0"
                  : "-translate-x-full md:translate-x-0"
              } absolute md:relative z-30 md:z-auto h-full transition-transform duration-300 ease-in-out`}
            >
              <ChannelSidebar
                onOpenSettings={handleOpenSettings}
                onActiveItemChange={handleActiveItemChange}
                activeItem={activeItem}
                onClose={isMobile ? () => setShowChannelSidebar(false) : undefined}
              />
            </div>
            
            {/* Overlay trên mobile khi sidebar mở */}
            {isMobile && showChannelSidebar && (
              <div
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
                onClick={() => setShowChannelSidebar(false)}
              />
            )}

            {/* Vùng hiển thị tin nhắn hoặc Friends view */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col">
              <MessageArea 
                activeItem={activeItem} 
                onActiveItemChange={handleActiveItemChange} 
              />
            </div>
          </div>

          {/* Cột 3: Sidebar bên phải - Active Now hoặc profile */}
          <div
            className={`${
              showRightSidebar
                ? "translate-x-0"
                : "translate-x-full"
            } absolute md:relative right-0 z-30 md:z-auto h-full transition-transform duration-300 ease-in-out`}
          >
            <RightSidebar 
              activeItem={activeItem}
              onClose={isMobile ? () => setShowRightSidebar(false) : undefined}
            />
          </div>
          
          {/* Overlay trên mobile khi right sidebar mở */}
          {isMobile && showRightSidebar && (
            <div
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              onClick={() => setShowRightSidebar(false)}
            />
          )}
        </div>
      </div>

      {/* Modal settings - hiển thị khi isSettingsOpen = true */}
      {isSettingsOpen && <SettingsModal onClose={handleCloseSettings} />}
      </UnreadMessagesProvider>
    </FriendsProvider>
  );
}

// Layout chính của Discord với providers
export default function DiscordLayout() {
  return (
    <UserStatusProvider>
      <DiscordLayoutContent />
    </UserStatusProvider>
  );
}

