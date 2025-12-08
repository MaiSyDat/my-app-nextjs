/**
 * Component Avatar - Hiển thị avatar user
 * 
 * Component này:
 * - Hiển thị ảnh avatar nếu có avatarUrl
 * - Fallback: hiển thị chữ cái đầu với gradient background (mặc định từ #5865F2 đến #4752C4)
 * - Hỗ trợ custom size và className
 * - Component dùng chung cho toàn bộ ứng dụng
 * - Đảm bảo đồng bộ hiển thị avatar ở tất cả các nơi
 */

"use client";

import { memo } from "react";
import Image from "next/image";

interface AvatarProps {
  /** Chữ cái đầu hoặc ký tự hiển thị trong avatar (fallback nếu không có avatarUrl) */
  initial: string;
  /** URL của ảnh avatar (nếu có sẽ hiển thị ảnh, không có sẽ hiển thị initial) */
  avatarUrl?: string;
  /** Kích thước avatar (mặc định: "md") */
  size?: "sm" | "md" | "lg" | "xl";
  /** Custom className cho container */
  className?: string;
  /** Custom gradient colors (from, to) */
  gradient?: {
    from: string;
    to: string;
  };
  /** Có hiển thị shadow không */
  shadow?: boolean;
  /** Có hover scale effect không */
  hoverScale?: boolean;
}

// Size mapping
const sizeMap = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
  xl: "w-12 h-12 text-lg",
};

// Component Avatar - Memoized để tối ưu performance
const Avatar = memo(function Avatar({
  initial,
  avatarUrl,
  size = "md",
  className = "",
  gradient = { from: "#5865F2", to: "#4752C4" },
  shadow = false,
  hoverScale = false,
}: AvatarProps) {
  const sizeClasses = sizeMap[size];
  const shadowClass = shadow ? "shadow-md" : "";
  const hoverClass = hoverScale ? "group-hover:scale-110 transition-transform" : "";

  // Nếu có avatarUrl, hiển thị ảnh
  if (avatarUrl) {
    const imageSize = size === "sm" ? 24 : size === "md" ? 32 : size === "lg" ? 40 : 48;
    return (
      <div
        className={`${sizeClasses} rounded-full flex items-center justify-center shrink-0 overflow-hidden ${shadowClass} ${hoverClass} ${className}`}
      >
        <Image
          src={avatarUrl}
          alt={initial}
          width={imageSize}
          height={imageSize}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  // Fallback: hiển thị chữ cái đầu với gradient background
  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center shrink-0 ${shadowClass} ${hoverClass} ${className}`}
      style={{
        background: `linear-gradient(to bottom right, ${gradient.from}, ${gradient.to})`,
      }}
    >
      <span className="text-white font-bold">
        {initial.toUpperCase()}
      </span>
    </div>
  );
});

Avatar.displayName = "Avatar";

export default Avatar;

