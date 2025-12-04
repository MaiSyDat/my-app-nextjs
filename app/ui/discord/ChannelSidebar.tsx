"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Props
interface ChannelSidebarProps {
  onOpenSettings?: () => void;
  onActiveItemChange?: (item: string) => void;
}

// Icon Component helper để load SVG từ public/icon/
interface IconProps {
  src: string;
  className?: string;
  size?: number;
}

const Icon = ({ src, className = "w-6 h-6", size = 24 }: IconProps) => {
  return (
    <Image
      src={`/icon/${src}`}
      alt="icon"
      width={size}
      height={size}
      className={className}
      unoptimized
    />
  );
};

// Icon Components sử dụng file SVG từ public/icon/
const FriendsIcon = () => (
  <Icon src="friends.svg" className="w-6 h-6" size={24} />
);
const NitroIcon = () => <Icon src="nitro.svg" className="w-6 h-6" size={24} />;
const ShopIcon = () => <Icon src="shop.svg" className="w-6 h-6" size={24} />;
const SearchIcon = () => (
  <Icon src="search.svg" className="w-4 h-4" size={16} />
);
const PlusIcon = () => <Icon src="plus.svg" className="w-3 h-3" size={12} />;
const MicIcon = () => <Icon src="mic.svg" className="w-5 h-5" size={20} />;
const HeadphoneIcon = () => (
  <Icon src="headphone.svg" className="w-5 h-5" size={20} />
);
const SettingsIcon = () => (
  <Icon src="settings.svg" className="w-5 h-5" size={20} />
);

export default function ChannelSidebar({
  onOpenSettings,
  onActiveItemChange,
}: ChannelSidebarProps) {
  const [activeItem, setActiveItem] = useState<
    "friends" | "nitro" | "shop" | string
  >("friends");

  // Handler để cập nhật activeItem và thông báo cho parent
  const handleItemClick = (id: string) => {
    setActiveItem(id);
    if (onActiveItemChange) {
      onActiveItemChange(id);
    }
  };

  // Gọi callback khi component mount để set initial title
  useEffect(() => {
    if (onActiveItemChange) {
      onActiveItemChange(activeItem);
    }
  }, []);

  // Helper để render từng dòng item điều hướng
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
    <div className="w-70 bg-linear-to-b from-[#F2F3F5] to-[#FFFFFF] flex flex-col h-full select-none font-sans shadow-2xl overflow-hidden">
      {/* --- HEADER: Search Bar --- */}
      <div className="h-12 px-2.5 flex items-center shadow-lg bg-[#F2F3F5] shrink-0 border-b border-[#E3E5E8] backdrop-blur-sm">
        <button className="w-full h-7 px-2 bg-[#FFFFFF] hover:bg-[#F7F8F9] text-[#747F8D] rounded text-sm transition-all duration-200 text-left flex items-center gap-2 group hover:shadow-md min-w-0">
          <div className="shrink-0">
            <SearchIcon />
          </div>
          <span className="text-xs truncate font-medium group-hover:text-[#060607] transition-colors min-w-0">
            Find or start a conversation
          </span>
        </button>
      </div>

      {/* --- SCROLLABLE AREA --- */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pt-2">
        {/* Main Navigation (Dọc thay vì Ngang) */}
        <NavItem id="friends" icon={<FriendsIcon />} label="Friends" />
        <NavItem id="nitro" icon={<NitroIcon />} label="Nitro" isNitro={true} />
        <NavItem id="shop" icon={<ShopIcon />} label="Shop" />

        {/* Separator */}
        <div className="h-px bg-linear-to-r from-transparent via-[#E3E5E8] to-transparent mx-2.5 my-3 opacity-60"></div>

        {/* DM Header */}
        <div className="flex items-center justify-between px-4 mb-1 group cursor-pointer hover:text-[#060607] text-[#747F8D] transition-all duration-200 min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider transition-colors group-hover:text-[#060607] truncate min-w-0">
            Direct Messages
          </h3>
          <button className="w-5 h-5 rounded-full bg-[#23A559] hover:bg-[#1E8E4A] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-md shrink-0 ml-2">
            <PlusIcon />
          </button>
        </div>

        {/* DM List */}
        <div className="space-y-px mt-1">
          {/* User 1: Hoang */}
          <div
            onClick={() => handleItemClick("user-1")}
            className={`flex items-center gap-2 px-2.5 py-2 mx-2 rounded-lg cursor-pointer group transition-all duration-200 relative min-w-0
            ${
              activeItem === "user-1"
                ? "bg-linear-to-r from-[#E3E5E8] to-[#D1D9DE] shadow-md"
                : "hover:bg-[#E3E5E8] hover:shadow-sm"
            }`}
          >
            {activeItem === "user-1" && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5865F2] rounded-r-full"></div>
            )}
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <span className="text-white text-sm font-bold">H</span>
              </div>
              {/* Status Indicator (Online + Mobile) */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#F2F3F5] rounded-full flex items-center justify-center ring-2 ring-[#F2F3F5]">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              </div>
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div
                className={`text-sm font-semibold truncate transition-colors ${
                  activeItem === "user-1"
                    ? "text-[#060607]"
                    : "text-[#747F8D] group-hover:text-[#060607]"
                }`}
              >
                Hoang
              </div>
              <div className="text-xs text-[#747F8D] truncate group-hover:text-[#4F5660] transition-colors">
                Playing Valorant
              </div>
            </div>
          </div>

          {/* User 2: Xuan An */}
          <div
            onClick={() => handleItemClick("user-2")}
            className={`flex items-center gap-2 px-2.5 py-2 mx-2 rounded-lg cursor-pointer group transition-all duration-200 relative min-w-0
            ${
              activeItem === "user-2"
                ? "bg-linear-to-r from-[#E3E5E8] to-[#D1D9DE] shadow-md"
                : "hover:bg-[#E3E5E8] hover:shadow-sm"
            }`}
          >
            {activeItem === "user-2" && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5865F2] rounded-r-full"></div>
            )}
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                <span className="text-sm font-bold">X</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#F2F3F5] rounded-full flex items-center justify-center ring-2 ring-[#F2F3F5]">
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full border-[2.5px] border-[#F2F3F5]"></div>
              </div>
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div
                className={`text-sm font-semibold truncate transition-colors ${
                  activeItem === "user-2"
                    ? "text-[#060607]"
                    : "text-[#747F8D] group-hover:text-[#060607]"
                }`}
              >
                Xuan An
              </div>
            </div>
            {/* Unread Badge */}
            <div className="bg-linear-to-r from-[#F23F42] to-[#E03E41] text-white text-[10px] font-bold px-1.5 rounded-full h-4 flex items-center justify-center shadow-md animate-pulse shrink-0">
              1
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER: User Area --- */}
      <div className="h-14 bg-linear-to-t from-[#F7F8F9] to-[#FFFFFF] flex items-center px-2 m-2 shrink-0 border border-[#DCDDDE] rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#E3E5E8] cursor-pointer mr-auto min-w-0 flex-1 transition-all duration-200 group">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#F0B232] to-[#E0A020] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-xs">U</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#F7F8F9] rounded-full flex items-center justify-center ring-2 ring-[#F7F8F9]">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            </div>
          </div>
          <div className="text-sm min-w-0 flex-1 overflow-hidden">
            <div className="font-bold text-[#060607] text-[13px] leading-tight -mb-0.5 truncate">
              Username
            </div>
            <div className="text-[11px] text-[#747F8D] truncate">#1234</div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-1">
          <button className="w-8 h-8 rounded-lg hover:bg-[#E3E5E8] flex items-center justify-center text-[#747F8D] hover:text-[#060607] transition-all duration-200 hover:scale-110 hover:shadow-md group">
            <MicIcon />
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-[#E3E5E8] flex items-center justify-center text-[#747F8D] hover:text-[#060607] transition-all duration-200 hover:scale-110 hover:shadow-md group">
            <HeadphoneIcon />
          </button>
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-lg hover:bg-[#E3E5E8] flex items-center justify-center text-[#747F8D] hover:text-[#060607] transition-all duration-200 hover:scale-110 hover:shadow-md group"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
