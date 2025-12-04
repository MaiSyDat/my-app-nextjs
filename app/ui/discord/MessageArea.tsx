"use client";

import Image from "next/image";
import { useRef, useEffect } from "react";

// Icon Component helper
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

// Props for MessageArea
interface MessageAreaProps {
  activeItem?: string;
}

// Main message area - shows chat when user is selected, otherwise shows Friends view
export default function MessageArea({ activeItem }: MessageAreaProps) {
  // Ref để scroll đến cuối messages
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Check if a user is selected (starts with "user-")
  const isUserChat = activeItem?.startsWith("user-");

  // Auto scroll to bottom when user chat is opened (mặc định ở cuối)
  useEffect(() => {
    if (isUserChat && messagesContainerRef.current) {
      // Sử dụng requestAnimationFrame để đảm bảo DOM đã render xong
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
    }
  }, [activeItem, isUserChat]);

  // User data mapping
  const userData: { [key: string]: { name: string; avatar: string; tag: string; joined: string; sharedServers: number } } = {
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
  };

  const currentUser = activeItem && userData[activeItem] ? userData[activeItem] : null;

  // If user chat is selected, show chat interface
  if (isUserChat && currentUser) {
    // TypeScript type narrowing - currentUser is guaranteed to be non-null here
    const user = currentUser;
    
    // Sample messages - nhiều messages để test scroll (defined inside if block to avoid null error)
    const messages: Array<{
      id: number;
      type?: string;
      date?: string;
      author?: string;
      avatar?: string;
      timestamp?: string;
      content?: string;
      icon?: string;
    }> = [
      {
        id: 0,
        type: "date",
        date: "6 tháng 6, 2024",
      },
      {
        id: 1,
        author: user.name,
        avatar: user.avatar,
        timestamp: "22:07 6/6/24",
        content: "hello ml",
      },
      {
        id: 2,
        type: "date",
        date: "7 tháng 6, 2024",
      },
      {
        id: 3,
        author: "SyxĐạt.?",
        avatar: "S",
        timestamp: "00:50 7/6/24",
        content: "Hé cái cức",
      },
      {
        id: 4,
        type: "date",
        date: "8 tháng 6, 2024",
      },
      {
        id: 5,
        type: "system",
        content: "SyxĐạt.? đã bắt đầu cuộc gọi kéo dài trong 3 phút.",
        timestamp: "16:19 8/6/24",
        icon: "phone",
      },
      {
        id: 6,
        author: "SyxĐạt.?",
        avatar: "S",
        timestamp: "16:22 8/6/24",
        content: "https://discord.gg/NaxF7UJ9",
      },
      {
        id: 7,
        author: user.name,
        avatar: user.avatar,
        timestamp: "16:25 8/6/24",
        content: "Ok để tôi join",
      },
      {
        id: 8,
        type: "date",
        date: "10 tháng 6, 2024",
      },
      {
        id: 9,
        author: "SyxĐạt.?",
        avatar: "S",
        timestamp: "14:30 10/6/24",
        content: "Hôm nay có chơi game không?",
      },
      {
        id: 10,
        author: user.name,
        avatar: user.avatar,
        timestamp: "14:35 10/6/24",
        content: "Có, tối nay nhé",
      },
      {
        id: 11,
        type: "date",
        date: "15 tháng 6, 2024",
      },
      {
        id: 12,
        type: "system",
        content: "SyxĐạt.? đã bắt đầu cuộc gọi kéo dài trong 15 phút.",
        timestamp: "20:00 15/6/24",
        icon: "phone",
      },
      {
        id: 13,
        author: "SyxĐạt.?",
        avatar: "S",
        timestamp: "20:20 15/6/24",
        content: "Game hay quá",
      },
      {
        id: 14,
        author: user.name,
        avatar: user.avatar,
        timestamp: "20:22 15/6/24",
        content: "Ừm, mai chơi tiếp",
      },
      {
        id: 15,
        type: "date",
        date: "20 tháng 6, 2024",
      },
      {
        id: 16,
        author: "SyxĐạt.?",
        avatar: "S",
        timestamp: "10:00 20/6/24",
        content: "Check tin nhắn này",
      },
      {
        id: 17,
        author: "SyxĐạt.?",
        avatar: "S",
        timestamp: "10:01 20/6/24",
        content: "Có link mới: https://discord.gg/ABC123",
      },
      {
        id: 18,
        type: "date",
        date: "25 tháng 6, 2024",
      },
      {
        id: 19,
        type: "system",
        content: "SyxĐạt.? đã bắt đầu cuộc gọi kéo dài trong 5 phút.",
        timestamp: "18:00 25/6/24",
        icon: "phone",
      },
      {
        id: 20,
        author: user.name,
        avatar: user.avatar,
        timestamp: "18:10 25/6/24",
        content: "Ok thanks",
      },
      {
        id: 21,
        type: "date",
        date: "1 tháng 7, 2024",
      },
      {
        id: 22,
        author: "SyxĐạt.?",
        avatar: "S",
        timestamp: "12:00 1/7/24",
        content: "Test scroll với nhiều tin nhắn",
      },
      {
        id: 23,
        author: user.name,
        avatar: user.avatar,
        timestamp: "12:01 1/7/24",
        content: "Scroll đang hoạt động tốt",
      },
      {
        id: 24,
        author: "SyxĐạt.?",
        avatar: "S",
        timestamp: "12:02 1/7/24",
        content: "Perfect!",
      },
    ];
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-linear-to-br from-[#FFFFFF] via-[#F7F8F9] to-[#F2F3F5]">
        {/* Chat Header */}
        <div className="h-12 px-4 flex items-center border-b border-[#E3E5E8] bg-[#FFFFFF] shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user.avatar}
              </span>
            </div>
            <h2 className="text-base font-semibold text-[#060607] truncate">
              {user.name}
            </h2>
          </div>
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

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 py-4">
          {/* User Profile Section - Always at the top */}
          <div className="flex flex-col items-center py-8 mb-4">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center mb-4 shadow-lg">
              <span className="text-white text-3xl font-bold">
                {user.avatar}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-[#060607] mb-1">
              {user.name}
            </h3>
            <p className="text-sm text-[#747F8D] mb-4">{user.tag}</p>
            <p className="text-sm text-[#747F8D] text-center max-w-md mb-6">
              Đây là phần mở đầu trong lịch sử các tin nhắn trực tiếp của bạn
              với {user.name}.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-md">
              <div className="flex items-center gap-2 px-4 py-2 hover:bg-[#E3E5E8] rounded cursor-pointer transition-colors">
                <Icon
                  src="friends.svg"
                  className="w-5 h-5 text-[#747F8D]"
                  size={20}
                />
                <span className="text-sm text-[#060607]">
                  {user.sharedServers} Máy Chủ Chung
                </span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-[#E3E5E8] hover:bg-[#D1D9DE] text-[#060607] text-sm font-medium rounded transition-colors">
                  Xóa Bạn
                </button>
                <button className="flex-1 px-4 py-2 bg-[#E3E5E8] hover:bg-[#D1D9DE] text-[#060607] text-sm font-medium rounded transition-colors">
                  Chặn
                </button>
              </div>
            </div>
          </div>

          {/* Messages List */}
          {messages.map((msg) => {
            if (msg.type === "date") {
              return (
                <div key={msg.id} className="flex items-center my-4">
                  <div className="flex-1 h-px bg-[#E3E5E8]"></div>
                  <span className="px-4 text-xs font-medium text-[#747F8D]">
                    {msg.date}
                  </span>
                  <div className="flex-1 h-px bg-[#E3E5E8]"></div>
                </div>
              );
            }
            if (msg.type === "system") {
              return (
                <div
                  key={msg.id}
                  className="flex items-center justify-center gap-2 my-2"
                >
                  {msg.icon === "phone" && (
                    <Icon
                      src="phone.svg"
                      className="w-4 h-4 text-green-500"
                      size={16}
                    />
                  )}
                  <span className="text-xs text-[#747F8D]">{msg.content}</span>
                  <span className="text-xs text-[#747F8D]">
                    {msg.timestamp}
                  </span>
                </div>
              );
            }
            return (
              <div
                key={msg.id}
                className="flex gap-3 my-2 group hover:bg-[#F7F8F9]/50 rounded px-2 py-1 -mx-2"
              >
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">
                    {msg.avatar}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-[#060607] text-sm">
                      {msg.author}
                    </span>
                    <span className="text-xs text-[#747F8D]">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-[#060607] wrap-break-word">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <div className="h-14 bg-linear-to-t from-[#F7F8F9] to-[#FFFFFF] flex items-center px-2 m-2 shrink-0 border border-[#DCDDDE] rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 w-full">
            {/* Input field với plus icon bên trong */}
            <div className="flex-1 relative">
              <button className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607] z-10">
                <Icon src="plus.svg" className="w-4 h-4" size={16} />
              </button>
              <input
                type="text"
                placeholder={`Nhắn @${user.name}`}
                className="w-full pl-10 pr-4 py-2 bg-[#FFFFFF] border border-[#E3E5E8] rounded-lg text-sm text-[#060607] placeholder-[#747F8D] focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20"
              />
            </div>

            {/* Icons bên phải */}
            <div className="flex items-center gap-1 shrink-0">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]">
                <Icon src="gift.svg" className="w-5 h-5" size={20} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]">
                <Icon src="gif.svg" className="w-5 h-5" size={20} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]">
                <Icon src="sticker.svg" className="w-5 h-5" size={20} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]">
                <Icon src="emoji.svg" className="w-5 h-5" size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default Friends view
  return (
    <div className="flex-1 flex flex-col bg-linear-to-br from-[#FFFFFF] via-[#F7F8F9] to-[#F2F3F5]">
      {/* Header with Friends label and buttons */}
      <div className="h-12 px-4 flex items-center border-b border-[#E3E5E8] bg-linear-to-r from-[#FFFFFF] to-[#F7F8F9] shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#5865F2]/20 group-hover:bg-[#5865F2]/30 transition-colors">
            <Icon src="chat.svg" className="w-5 h-5 text-[#5865F2]" size={20} />
          </div>
          <h2 className="text-base font-bold text-[#060607]">Friends</h2>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-1.5 text-sm font-medium text-[#060607] bg-[#E3E5E8] rounded-lg transition-all duration-200 shadow-md">
            All
          </button>
          <button className="px-4 py-1.5 text-sm font-medium text-[#060607] bg-[#E3E5E8] rounded-lg transition-all duration-200 shadow-md">
            Pending
          </button>
          <button className="px-4 py-1.5 text-sm font-semibold text-white bg-linear-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3C45A5] rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105">
            Add Friend
          </button>
        </div>
      </div>

      {/* Centered empty state */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-linear-to-r from-[#5865F2] to-[#4752C4] blur-2xl opacity-20 rounded-full"></div>
            <div className="relative p-6 bg-linear-to-br from-[#F2F3F5] to-[#FFFFFF] rounded-2xl shadow-2xl border border-[#E3E5E8]">
              <Icon
                src="friends.svg"
                className="w-20 h-20 mx-auto text-[#5865F2]"
                size={80}
              />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#060607] mb-3">
            No friends are online at this time.
          </h3>
          <p className="text-[#747F8D] text-sm leading-relaxed">
            Wumpus is waiting on friends. You don't have to though!
          </p>
          <button className="mt-6 px-6 py-2.5 bg-linear-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3C45A5] text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
            Add Friend
          </button>
        </div>
      </div>
    </div>
  );
}


