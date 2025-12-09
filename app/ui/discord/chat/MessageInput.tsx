/**
 * Component input để gửi tin nhắn
 * 
 * Component này xử lý:
 * - Input field để nhập tin nhắn
 * - Gửi tin nhắn khi nhấn Enter hoặc click button
 * - Auto-resize textarea khi nội dung dài
 * - Disable button khi input rỗng
 */

"use client";

import { memo } from "react";
import Icon from "../../common/Icon";

interface MessageInputProps {
  userName: string;
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean; // Thêm prop disabled
}

// Component input để gửi tin nhắn - Memoized
const MessageInput = memo(function MessageInput({ userName, value, onChange, onKeyPress, disabled = false }: MessageInputProps) {
  return (
    <div className={`h-14 bg-linear-to-t from-[#F7F8F9] to-[#FFFFFF] flex items-center px-2 m-2 shrink-0 border border-[#DCDDDE] rounded-lg shadow-lg overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="flex items-center gap-2 w-full">
        {/* Input field với plus icon bên trong */}
        <div className="flex-1 relative">
          <button 
            disabled={disabled}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded hover:bg-[#E3E5E8] transition-colors text-[#747F8D] hover:text-[#060607] z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon src="plus.svg" className="w-4 h-4" size={16} />
          </button>
          <input
            type="text"
            placeholder={disabled ? "You cannot send messages to this user" : `Message @${userName}`}
            value={value}
            onChange={(e) => !disabled && onChange(e.target.value)}
            onKeyPress={(e) => !disabled && onKeyPress(e)}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8F9] border border-[#E3E5E8] rounded-lg text-sm text-[#060607] placeholder-[#747F8D] focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Icons bên phải */}
        <div className="flex items-center gap-1 shrink-0">
          <button 
            disabled={disabled}
            className="w-8 h-8 rounded-lg hover:bg-[#E3E5E8] flex items-center justify-center text-[#747F8D] hover:text-[#060607] transition-all duration-200 hover:scale-110 hover:shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon src="gift.svg" className="w-5 h-5" size={20} />
          </button>
          <button 
            disabled={disabled}
            className="w-8 h-8 rounded-lg hover:bg-[#E3E5E8] flex items-center justify-center text-[#747F8D] hover:text-[#060607] transition-all duration-200 hover:scale-110 hover:shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon src="gif.svg" className="w-5 h-5" size={20} />
          </button>
          <button 
            disabled={disabled}
            className="w-8 h-8 rounded-lg hover:bg-[#E3E5E8] flex items-center justify-center text-[#747F8D] hover:text-[#060607] transition-all duration-200 hover:scale-110 hover:shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon src="sticker.svg" className="w-5 h-5" size={20} />
          </button>
          <button 
            disabled={disabled}
            className="w-8 h-8 rounded-lg hover:bg-[#E3E5E8] flex items-center justify-center text-[#747F8D] hover:text-[#060607] transition-all duration-200 hover:scale-110 hover:shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon src="emoji.svg" className="w-5 h-5" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
});

MessageInput.displayName = "MessageInput";

export default MessageInput;

