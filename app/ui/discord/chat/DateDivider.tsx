/**
 * Component hiển thị divider theo ngày trong danh sách tin nhắn
 * 
 * Component này:
 * - Hiển thị ngày/tháng/năm
 * - Format date theo locale vi-VN
 * - Styling với gradient và border
 */

"use client";

import { memo, useMemo } from "react";

interface DateDividerProps {
  date: Date | string;
}

// Component hiển thị date divider giữa các tin nhắn - Memoized
const DateDivider = memo(function DateDivider({ date }: DateDividerProps) {
  const formattedDate = useMemo(() => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [date]);

  return (
    <div className="flex items-center my-4" role="separator">
      <div className="flex-1 h-px bg-[#E3E5E8]"></div>
      <span className="px-4 text-xs font-medium text-[#747F8D]">
        {formattedDate}
      </span>
      <div className="flex-1 h-px bg-[#E3E5E8]"></div>
    </div>
  );
});

DateDivider.displayName = "DateDivider";

export default DateDivider;

