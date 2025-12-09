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

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ServerList from "./ServerList";
import ChannelSidebar from "./ChannelSidebar";
import MessageArea from "../chat/MessageArea";
import RightSidebar from "./RightSidebar";
import TopBar from "./TopBar";
// Providers được đặt ở level cao hơn trong (discord)/layout.tsx
import { useUserStatus } from "@/app/hooks/useUserStatus";

// Lazy load SettingsModal để tối ưu performance
const SettingsModal = dynamic(() => import("../settings/SettingsModal"), {
  ssr: false,
});

// Layout chính của Discord - 3 cột, top bar và settings modal
function DiscordLayoutContent() {
  // Theo dõi trạng thái của user hiện tại
  useUserStatus();

  const pathname = usePathname();
  const router = useRouter();

  // State quản lý modal settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Parse activeItem từ URL: /channels/me -> "friends", /channels/me/[userId] -> "user-{userId}"
  const getActiveItemFromPath = useCallback(() => {
    if (!pathname) return "friends";
    
    if (pathname === "/channels/me") return "friends";
    
    const match = pathname.match(/^\/channels\/me\/([^/]+)$/);
    if (match && match[1]) {
      return `user-${match[1]}`;
    }
    
    return "friends";
  }, [pathname]);
  
  const activeItem = getActiveItemFromPath();
  
  // State quản lý responsive: mobile menu và sidebars
  const [showChannelSidebar, setShowChannelSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile (< 768px) và tự động ẩn sidebars trên mobile
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

  // Navigate đến URL tương ứng và đóng sidebar trên mobile khi chọn chat
  const handleActiveItemChange = useCallback((item: string) => {
    if (item === "friends") {
      router.push("/channels/me");
    } else if (item === "nitro") {
      router.push("/nitro");
    } else if (item === "shop") {
      router.push("/store");
    } else if (item.startsWith("user-")) {
      const userId = item.replace("user-", "");
      router.push(`/channels/me/${userId}`);
    }
    
    if (isMobile && item.startsWith("user-")) {
      setShowChannelSidebar(false);
    }
  }, [isMobile, router]);

  const toggleChannelSidebar = useCallback(() => {
    setShowChannelSidebar((prev) => !prev);
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setShowRightSidebar((prev) => !prev);
  }, []);

  // Memoize components để tránh re-render không cần thiết (chỉ re-render khi dependencies thay đổi)
  const memoizedServerList = useMemo(() => <ServerList />, []);
  
  const memoizedTopBar = useMemo(() => (
    <TopBar 
      title={activeItem} 
      onToggleChannelSidebar={isMobile ? toggleChannelSidebar : undefined}
      onToggleRightSidebar={isMobile ? toggleRightSidebar : undefined}
    />
  ), [activeItem, isMobile, toggleChannelSidebar, toggleRightSidebar]);
  
  const memoizedChannelSidebar = useMemo(() => (
    <ChannelSidebar
      onOpenSettings={handleOpenSettings}
      onActiveItemChange={handleActiveItemChange}
      activeItem={activeItem}
      onClose={isMobile ? () => setShowChannelSidebar(false) : undefined}
    />
  ), [activeItem, handleOpenSettings, handleActiveItemChange, isMobile]);
  
  const memoizedRightSidebar = useMemo(() => (
    <RightSidebar 
      activeItem={activeItem}
      onClose={isMobile ? () => setShowRightSidebar(false) : undefined}
    />
  ), [activeItem, isMobile]);

  return (
    <>
      {/* Container chính - full screen với gradient background */}
      <div className="flex h-screen bg-linear-to-br from-[#FFFFFF] via-[#F7F8F9] to-[#F2F3F5] text-[#060607] overflow-hidden flex-col">
        {/* Top bar - thanh bar cố định ở trên */}
        {memoizedTopBar}

        {/* Vùng nội dung chính - 3 cột */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* Cột 1: Danh sách server - ẩn trên mobile */}
          <div className={`${isMobile ? "hidden" : "block"} shrink-0`}>
            {memoizedServerList}
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
              {memoizedChannelSidebar}
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
            {memoizedRightSidebar}
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
    </>
  );
}

// Layout chính của Discord (providers được đặt ở level cao hơn)
export default function DiscordLayout() {
  return <DiscordLayoutContent />;
}

