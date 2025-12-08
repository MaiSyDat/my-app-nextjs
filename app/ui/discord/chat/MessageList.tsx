/**
 * Component hiển thị danh sách tin nhắn
 * 
 * Component này xử lý:
 * - Hiển thị danh sách tin nhắn với lazy loading
 * - Tự động scroll xuống tin nhắn mới
 * - Hiển thị DateDivider để phân chia theo ngày
 * - Memoized để tối ưu performance
 * - Lazy load thêm tin nhắn khi scroll lên đầu
 */

"use client";

import { useRef, useMemo, memo } from "react";
import DateDivider from "./DateDivider";
import MessageItem from "./MessageItem";

interface Message {
  id: number;
  messageId?: string;
  type?: string;
  date?: string;
  author?: string;
  avatar?: string;
  timestamp?: string;
  content?: string;
  icon?: string;
  createdAt?: Date | string;
  senderId?: string;
}

interface MessageListProps {
  messages: Message[];
  displayedCount: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  userProfileHeader?: React.ReactNode;
  currentUserId?: string | null;
}

// Component hiển thị danh sách tin nhắn với date divider logic - Memoized
const MessageList = memo(function MessageList({ messages, displayedCount, onScroll, containerRef, userProfileHeader, currentUserId }: MessageListProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = containerRef || internalRef;

  // Logic kiểm tra có nên hiển thị date divider không
  const shouldShowDateDivider = (msg: Message, index: number, array: Message[]) => {
    // Nếu là tin nhắn đầu tiên, luôn hiển thị date divider
    if (index === 0) return true;
    
    // Nếu là tin nhắn system hoặc date, không hiển thị date divider
    if (msg.type === "system" || msg.type === "date") return false;
    
    let prevMsg = array[index - 1];
    
    // Nếu tin nhắn trước là system hoặc date, tìm tin nhắn trước đó không phải system/date
    if (prevMsg.type === "system" || prevMsg.type === "date") {
      let prevNormalMsg = null;
      for (let i = index - 1; i >= 0; i--) {
        if (array[i].type !== "system" && array[i].type !== "date") {
          prevNormalMsg = array[i];
          break;
        }
      }
      if (!prevNormalMsg) return true;
      prevMsg = prevNormalMsg;
    }
    
    // So sánh thời gian
    if (msg.createdAt && prevMsg.createdAt) {
      const currentTime = new Date(msg.createdAt).getTime();
      const prevTime = new Date(prevMsg.createdAt).getTime();
      const diffMinutes = (currentTime - prevTime) / (1000 * 60);
      
      // Hiển thị date divider nếu cách nhau >= 15 phút
      if (diffMinutes >= 15) return true;
      
      // Hoặc nếu khác ngày
      const currentDate = new Date(msg.createdAt).toDateString();
      const prevDate = new Date(prevMsg.createdAt).toDateString();
      if (currentDate !== prevDate) return true;
    }
    
    return false;
  };

  // Memoize displayed messages để tránh re-render không cần thiết
  const displayedMessages = useMemo(() => {
    return messages.slice(-displayedCount);
  }, [messages, displayedCount]);

  // Memoize divider flags để tránh tính toán lại
  const dividerFlags = useMemo(() => {
    const flags: boolean[] = [];
    displayedMessages.forEach((msg, index) => {
      flags[index] = shouldShowDateDivider(msg, index, displayedMessages);
    });
    return flags;
  }, [displayedMessages]);

  return (
    <div 
      ref={ref}
      className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 py-4"
      style={{ scrollBehavior: 'auto' }}
      onScroll={onScroll}
    >
      {userProfileHeader && (
        <div className="mb-4">
          {userProfileHeader}
        </div>
      )}
      {displayedMessages.map((msg, index) => {
        // Kiểm tra có nên hiển thị date divider (đã được memoized)
        const showDivider = dividerFlags[index];
        
        // Nếu là date type (legacy)
        if (msg.type === "date") {
          return (
            <div key={msg.id} className="flex items-center my-4" role="separator">
              <div className="flex-1 h-px bg-[#E3E5E8]"></div>
              <span className="px-4 text-xs font-medium text-[#747F8D]">
                {msg.date}
              </span>
              <div className="flex-1 h-px bg-[#E3E5E8]"></div>
            </div>
          );
        }

        return (
          <div key={msg.id}>
            {showDivider && msg.createdAt && (
              <DateDivider date={msg.createdAt} />
            )}
            <MessageItem
              id={msg.id}
              messageId={msg.messageId}
              author={msg.author || ""}
              avatar={msg.avatar || ""}
              timestamp={msg.timestamp || ""}
              content={msg.content || ""}
              type={msg.type}
              icon={msg.icon}
              senderId={msg.senderId}
              currentUserId={currentUserId}
            />
          </div>
        );
      })}
    </div>
  );
});

MessageList.displayName = "MessageList";

export default MessageList;

