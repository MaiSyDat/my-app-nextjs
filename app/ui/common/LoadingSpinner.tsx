/**
 * Component LoadingSpinner - Hiển thị loading spinner
 * 
 * Component này:
 * - Hiển thị spinner loading với animation
 * - Hỗ trợ custom size và color
 * - Component dùng chung cho toàn bộ ứng dụng
 */

"use client";

import { memo } from "react";

interface LoadingSpinnerProps {
  /** Kích thước spinner (mặc định: "md") */
  size?: "sm" | "md" | "lg" | "xl";
  /** Màu spinner (mặc định: "#5865F2") */
  color?: string;
  /** Custom className */
  className?: string;
  /** Text hiển thị bên cạnh spinner */
  text?: string;
}

// Size mapping
const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-3",
  xl: "w-16 h-16 border-4",
};

// Component LoadingSpinner - Memoized để tối ưu performance
const LoadingSpinner = memo(function LoadingSpinner({
  size = "md",
  color = "#5865F2",
  className = "",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = sizeMap[size];

  return (
    <div className={`flex items-center ${className}`}>
      <div
        className={`${sizeClasses} border-t-transparent rounded-full animate-spin`}
        style={{
          borderColor: color,
          borderTopColor: "transparent",
        }}
      />
      {text && <span className="ml-3 text-sm text-[#747F8D]">{text}</span>}
    </div>
  );
});

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;

