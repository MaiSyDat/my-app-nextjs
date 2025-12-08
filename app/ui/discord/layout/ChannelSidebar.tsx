/**
 * Component Sidebar bên trái - Danh sách bạn bè và Direct Messages
 * 
 * Component này hiển thị:
 * - Navigation items (Friends, Nitro, Shop)
 * - Danh sách Direct Messages với unread count badge
 * - User profile ở footer với các nút điều khiển
 * - Responsive design cho mobile với close button
 * - Hiển thị badge số tin nhắn chưa đọc (tối đa 5+)
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "../../common/Icon";
import Avatar from "../../common/Avatar";
import StatusIndicator from "../../common/StatusIndicator";
import { useFriendsContext } from "@/app/contexts/FriendsContext";
import { useUnreadMessages } from "@/app/contexts/UnreadMessagesContext";
import { useUserStatusContext } from "@/app/contexts/UserStatusContext";
import { useUserStatus } from "@/app/hooks/useUserStatus";
import { getUserFromStorage } from "@/app/lib/utils";

// Props
interface ChannelSidebarProps {
  onOpenSettings?: () => void;
  onActiveItemChange?: (item: string) => void;
  activeItem?: string;
  onClose?: () => void; // For mobile close button
}

export default function ChannelSidebar({
  onOpenSettings,
  onActiveItemChange,
  activeItem: propActiveItem,
  onClose,
}: ChannelSidebarProps) {
  const [localActiveItem, setLocalActiveItem] = useState<
    "friends" | "nitro" | "shop" | string
  >("friends");
  
  const activeItem = propActiveItem || localActiveItem;
  
  const [user, setUser] = useState<{
    username: string;
    email: string;
    id: string;
  } | null>(null);
  
  // Sử dụng FriendsContext để quản lý friends state tập trung
  const { friends, loading: loadingFriends } = useFriendsContext();
  
  // Sử dụng useUnreadMessages để lấy số tin nhắn chưa đọc
  const { unreadCounts } = useUnreadMessages();

  // Sử dụng useUserStatusContext để lấy trạng thái của users
  const { getUserStatus } = useUserStatusContext();
  
  // Sử dụng useUserStatus để lấy trạng thái của user hiện tại
  const { status: currentUserStatus } = useUserStatus();

  // Convert friends thành directMessages format với unread count và status
  // Sử dụng useMemo để tránh re-compute không cần thiết
  const directMessages = useMemo(() => {
    return friends.map((friendItem) => {
      const friendId = String(friendItem.friend.id);
      const unreadCount = unreadCounts[friendId] || 0;
      const status = getUserStatus(friendId);
      return {
        id: friendItem.friend.id,
        username: friendItem.friend.username,
        email: friendItem.friend.email,
        status: status,
        unreadCount: unreadCount > 5 ? 5 : unreadCount,
        unreadCountRaw: unreadCount,
        activity: undefined,
      };
    });
  }, [friends, unreadCounts, getUserStatus]);

  useEffect(() => {
    const user = getUserFromStorage();
    if (user) {
      setUser({
        username: user.username || "",
        email: user.email || "",
        id: user.id || user._id || "",
      });
    }
  }, []);

  const getInitials = (username: string) => {
    if (!username) return "U";
    return username.charAt(0).toUpperCase();
  };

  const getUserTag = () => {
    if (!user) return "#1234";
    const id = user.id || user.email || "";
    const last4 = id.slice(-4).replace(/\D/g, "") || "1234";
    return `#${last4.padStart(4, "0")}`;
  };

  const handleItemClick = (id: string) => {
    setLocalActiveItem(id);
    if (onActiveItemChange) {
      onActiveItemChange(id);
    }
  };
  
  useEffect(() => {
    if (propActiveItem) {
      setLocalActiveItem(propActiveItem);
    }
  }, [propActiveItem]);

  useEffect(() => {
    if (onActiveItemChange) {
      onActiveItemChange(activeItem);
    }
  }, []);

  const NavItem = ({ id, icon, label, badge, isNitro }: any) => (
    <button
      onClick={() => handleItemClick(id)}
      className={`group w-full flex items-center gap-2 px-2 py-2.5 rounded-lg mx-2 mb-0.5 transition-all duration-200 relative min-w-0
        ${
          activeItem === id
            ? "bg-linear-to-r from-[#5865F2] to-[#4752C4] text-white shadow-lg shadow-[#5865F2]/30"
            : "text-[#747F8D] hover:bg-[#E3E5E8] hover:text-[#060607] hover:shadow-md"
        }`}
    >
      {activeItem === id && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
      )}
      <div
        className={`transition-transform group-hover:scale-110 shrink-0 ${
          activeItem === id
            ? "text-white"
            : "text-[#949BA4] group-hover:text-[#DBDEE1]"
        }`}
      >
        {icon}
      </div>
      <span className="font-semibold text-[15px] flex-1 text-left truncate min-w-0">
        {label}
      </span>
      {isNitro && (
        <span className="bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shadow-md animate-pulse shrink-0 mx-2">
          New
        </span>
      )}
    </button>
  );

  return (
    <div className="w-70 md:w-70 bg-linear-to-b from-[#F2F3F5] to-[#FFFFFF] flex flex-col h-full select-none font-sans shadow-2xl overflow-hidden">
      {/* Header - Thanh tìm kiếm */}
      <div className="h-12 px-2.5 flex items-center shadow-lg bg-[#F2F3F5] shrink-0 border-b border-[#E3E5E8] backdrop-blur-sm">
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607] mr-2 shrink-0"
            aria-label="Close sidebar"
          >
            <Icon src="arrow-left.svg" className="w-5 h-5" size={20} />
          </button>
        )}
        <button className="w-full h-7 px-2 bg-[#FFFFFF] hover:bg-[#F7F8F9] text-[#747F8D] rounded text-sm transition-all duration-200 text-left flex items-center gap-2 group hover:shadow-md min-w-0">
          <div className="shrink-0">
            <Icon src="search.svg" className="w-4 h-4" size={16} />
          </div>
          <span className="text-xs truncate font-medium group-hover:text-[#060607] transition-colors min-w-0">
            Find or start a conversation
          </span>
        </button>
      </div>

      {/* Vùng scroll - Danh sách navigation và DM */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pt-2">
        {/* Navigation items - Friends, Nitro, Shop */}
        <NavItem id="friends" icon={<Icon src="friends.svg" className="w-6 h-6" size={24} />} label="Friends" />
        <NavItem id="nitro" icon={<Icon src="nitro.svg" className="w-6 h-6" size={24} />} label="Nitro" isNitro={true} />
        <NavItem id="shop" icon={<Icon src="shop.svg" className="w-6 h-6" size={24} />} label="Shop" />

        {/* Đường phân cách */}
        <div className="h-px bg-linear-to-r from-transparent via-[#E3E5E8] to-transparent mx-2.5 my-3 opacity-60"></div>

        {/* Header Direct Messages */}
        <div className="flex items-center justify-between px-4 mb-1 group cursor-pointer hover:text-[#060607] text-[#747F8D] transition-all duration-200 min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider transition-colors group-hover:text-[#060607] truncate min-w-0">
            Direct Messages
          </h3>
          <button className="w-5 h-5 rounded-full bg-[#23A559] hover:bg-[#1E8E4A] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-md shrink-0 ml-2">
            <Icon src="plus.svg" className="w-3 h-3" size={12} />
          </button>
        </div>

        {/* Danh sách Direct Messages */}
        <div className="space-y-px mt-1">
          {loadingFriends ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#5865F2]"></div>
            </div>
          ) : directMessages.length > 0 ? (
            directMessages.map((dmUser) => {
              const userItemId = `user-${dmUser.id}`;
              const isActive = activeItem === userItemId;
              const getInitial = (name: string) => name.charAt(0).toUpperCase();
              
              return (
                <div
                  key={dmUser.id}
                  onClick={() => handleItemClick(userItemId)}
                  className={`flex items-center gap-2 px-2.5 py-2 mx-2 rounded-lg cursor-pointer group transition-all duration-200 relative min-w-0
                  ${
                    isActive
                      ? "bg-linear-to-r from-[#E3E5E8] to-[#D1D9DE] shadow-md"
                      : "hover:bg-[#E3E5E8] hover:shadow-sm"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5865F2] rounded-r-full"></div>
                  )}
                  <div className="relative shrink-0">
                    <Avatar
                      initial={getInitial(dmUser.username)}
                      size="md"
                      shadow
                      hoverScale
                    />
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <StatusIndicator
                        status={dmUser.status}
                        size="md"
                        animate
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div
                      className={`text-sm font-semibold truncate transition-colors ${
                        isActive
                          ? "text-[#060607]"
                          : "text-[#747F8D] group-hover:text-[#060607]"
                      }`}
                    >
                      {dmUser.username}
                    </div>
                    {dmUser.activity && (
                      <div className="text-xs text-[#747F8D] truncate group-hover:text-[#4F5660] transition-colors">
                        {dmUser.activity}
                      </div>
                    )}
                  </div>
                  {dmUser.unreadCountRaw > 0 && (
                    <div className="bg-linear-to-r from-[#F23F42] to-[#E03E41] text-white text-[10px] font-bold px-1.5 rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-md shrink-0 animate-pulse">
                      {dmUser.unreadCountRaw > 5 ? "5+" : dmUser.unreadCountRaw}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-2 text-xs text-[#747F8D] text-center">
              Chưa có tin nhắn trực tiếp
            </div>
          )}
        </div>
      </div>

      {/* Footer - Thông tin user và các nút điều khiển */}
      <div className="h-14 bg-linear-to-t from-[#F7F8F9] to-[#FFFFFF] flex items-center px-2 m-2 shrink-0 border border-[#DCDDDE] rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#E3E5E8] cursor-pointer mr-auto min-w-0 flex-1 transition-all duration-200 group">
          <div className="relative shrink-0">
            <Avatar
              initial={user ? getInitials(user.username) : "U"}
              size="md"
              gradient={{ from: "#F0B232", to: "#E0A020" }}
              shadow
              hoverScale
            />
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusIndicator status={currentUserStatus} size="sm" animate />
            </div>
          </div>
          <div className="text-sm min-w-0 flex-1 overflow-hidden">
            <div className="font-bold text-[#060607] text-[13px] leading-tight -mb-0.5 truncate">
              {user ? user.username : "Username"}
            </div>
            <div className="text-[11px] text-[#747F8D] truncate">
              {getUserTag()}
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          <button className="w-8 h-8 rounded-lg hover:bg-[#E3E5E8] flex items-center justify-center text-[#747F8D] hover:text-[#060607] transition-all duration-200 hover:scale-110 hover:shadow-md group">
            <Icon src="mic.svg" className="w-5 h-5" size={20} />
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-[#E3E5E8] flex items-center justify-center text-[#747F8D] hover:text-[#060607] transition-all duration-200 hover:scale-110 hover:shadow-md group">
            <Icon src="headphone.svg" className="w-5 h-5" size={20} />
          </button>
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-lg hover:bg-[#E3E5E8] flex items-center justify-center text-[#747F8D] hover:text-[#060607] transition-all duration-200 hover:scale-110 hover:shadow-md group"
          >
            <Icon src="settings.svg" className="w-5 h-5" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

