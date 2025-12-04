"use client";

import Image from "next/image";

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

// Props for TopBar
interface TopBarProps {
  title: string;
}

// Top bar cố định ở trên đầu Discord interface
export default function TopBar({ title }: TopBarProps) {
  // Map title để hiển thị đúng tên
  const getDisplayTitle = (title: string) => {
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
  };

  return (
    <div className="px-2 bg-[#F2F3F5] border-b border-[#E3E5E8] flex items-center justify-between shrink-0 shadow-lg z-10 relative">
      {/* Center: Icon và Title căn giữa */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 justify-center">
        <Icon
          src="quick-switcher.svg"
          className="w-4 h-4 text-sm shrink-0"
          size={16}
        />
        <div className="text-[12px] font-medium text-[#2E3338]">
          {getDisplayTitle(title)}
        </div>
      </div>

      {/* Right side: Inbox and Help buttons */}
      <div className="flex items-center gap-1 flex-1 justify-end">
        {/* Inbox button */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]"
          aria-label="Hộp thư đến"
          role="button"
          tabIndex={0}
        >
          <Icon src="inbox.svg" className="w-6 h-6" size={24} />
        </button>

        {/* Help button */}
        <a
          href="https://support.discord.com"
          rel="noreferrer noopener"
          target="_blank"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607]"
          aria-label="Trợ giúp"
          tabIndex={0}
        >
          <Icon src="help.svg" className="w-6 h-6" size={24} />
        </a>
      </div>
    </div>
  );
}

