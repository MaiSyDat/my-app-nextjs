/**
 * Component StatusIndicator - Hiển thị trạng thái online/offline
 * 
 * Component này:
 * - Hiển thị badge trạng thái (online/offline)
 * - Hỗ trợ custom size
 * - Component dùng chung cho toàn bộ ứng dụng
 */

"use client";

import { memo } from "react";

interface StatusIndicatorProps {
  /** Trạng thái: "online" hoặc "offline" */
  status: "online" | "offline";
  /** Kích thước indicator (mặc định: "md") */
  size?: "sm" | "md" | "lg";
  /** Custom className */
  className?: string;
  /** Có animate pulse không (chỉ cho online) */
  animate?: boolean;
}

// Size mapping
const sizeMap = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3.5 h-3.5",
};

// Container size mapping
const containerSizeMap = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-3.5 h-3.5",
};

// Component StatusIndicator - Memoized để tối ưu performance
const StatusIndicator = memo(function StatusIndicator({
  status,
  size = "md",
  className = "",
  animate = true,
}: StatusIndicatorProps) {
  const dotSize = sizeMap[size];
  const containerSize = containerSizeMap[size];
  const isOnline = status === "online";

  return (
    <div
      className={`${containerSize} bg-[#F2F3F5] rounded-full flex items-center justify-center ring-2 ring-[#F2F3F5] ${className}`}
    >
      {isOnline ? (
        <div
          className={`${dotSize} bg-green-500 rounded-full ${
            animate ? "animate-pulse shadow-lg shadow-green-500/50" : ""
          }`}
        />
      ) : (
        <div className={`${dotSize} bg-gray-400 rounded-full border-[2.5px] border-[#F2F3F5]`} />
      )}
    </div>
  );
});

StatusIndicator.displayName = "StatusIndicator";

export default StatusIndicator;

