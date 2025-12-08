/**
 * Component hiển thị một tin nhắn đơn lẻ
 * 
 * Component này hiển thị:
 * - Avatar và tên người gửi
 * - Nội dung tin nhắn với URL detection
 * - Link preview cho URL đầu tiên trong tin nhắn
 * - Timestamp của tin nhắn
 * - Memoized để tối ưu performance
 */

"use client";

import { memo } from "react";
import Icon from "../../common/Icon";
import Avatar from "../../common/Avatar";
import { parseTextWithUrls } from "@/app/lib/url/urlUtils";
import LinkPreview from "./LinkPreview";

interface MessageItemProps {
  id: number;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  type?: string;
  icon?: string;
}

// Component hiển thị 1 tin nhắn - Memoized để tránh re-render không cần thiết
const MessageItem = memo(function MessageItem({ 
  id, 
  author, 
  avatar, 
  timestamp, 
  content, 
  type,
  icon 
}: MessageItemProps) {
  // Nếu là tin nhắn system (ví dụ: cuộc gọi)
  if (type === "system") {
    return (
      <div className="flex items-center justify-center gap-2 my-2">
        {icon === "phone" && (
          <Icon
            src="phone.svg"
            className="w-4 h-4 text-green-500"
            size={16}
          />
        )}
        <span className="text-xs text-[#747F8D]">{content}</span>
        <span className="text-xs text-[#747F8D]">
          {timestamp}
        </span>
      </div>
    );
  }

  // Parse content để tìm URLs
  const contentSegments = parseTextWithUrls(content);
  
  // Tìm URL đầu tiên để hiển thị preview (chỉ hiển thị 1 preview cho mỗi tin nhắn)
  const firstUrl = contentSegments.find(seg => seg.isUrl && seg.url)?.url;

  // Tin nhắn thông thường
  return (
    <div className="flex gap-3 my-2 group hover:bg-[#F7F8F9]/50 rounded px-2 py-1 -mx-2">
      <Avatar initial={avatar} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-[#060607] text-sm">
            {author}
          </span>
          <span className="text-xs text-[#747F8D]">
            {timestamp}
          </span>
        </div>
        <p className="text-sm text-[#060607] wrap-break-word">
          {contentSegments.map((segment, index) => {
            if (segment.isUrl && segment.url) {
              return (
                <a
                  key={index}
                  href={segment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00A8FC] hover:text-[#0099E6] hover:underline break-all"
                >
                  {segment.text}
                </a>
              );
            }
            return <span key={index}>{segment.text}</span>;
          })}
        </p>
        {/* Link Preview - chỉ hiển thị cho URL đầu tiên */}
        {firstUrl && <LinkPreview url={firstUrl} />}
      </div>
    </div>
  );
});

MessageItem.displayName = "MessageItem";

export default MessageItem;

