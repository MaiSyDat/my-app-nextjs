/**
 * Component Icon - Hiển thị SVG icons
 * 
 * Component này:
 * - Load SVG icons từ /icon/ directory
 * - Hỗ trợ custom className và size
 * - Sử dụng Next.js Image component để tối ưu
 * - Component dùng chung cho toàn bộ ứng dụng
 */

"use client";

import Image from "next/image";

interface IconProps {
  src: string;
  className?: string;
  size?: number;
}

// Component Icon để hiển thị SVG icons - Dùng chung cho toàn bộ ứng dụng
export default function Icon({ src, className = "w-6 h-6", size = 24 }: IconProps) {
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
}

