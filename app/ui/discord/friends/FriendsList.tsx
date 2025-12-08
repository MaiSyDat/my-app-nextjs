/**
 * Component hiển thị danh sách bạn bè (All tab)
 * 
 * Component này:
 * - Hiển thị danh sách tất cả bạn bè đã accepted
 * - Empty state khi chưa có bạn bè
 * - Loading state khi đang fetch
 * - Memoized để tối ưu performance
 * - Click vào bạn bè để mở chat
 */

"use client";

import { memo } from "react";
import Icon from "../../common/Icon";
import Avatar from "../../common/Avatar";
import StatusIndicator from "../../common/StatusIndicator";
import LoadingSpinner from "../../common/LoadingSpinner";

interface Friend {
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    email: string;
  };
}

interface FriendsListProps {
  friends: Friend[];
  loading: boolean;
  onFriendClick: (friendId: string) => void;
  onAddFriendClick: () => void;
}

// Component hiển thị danh sách bạn bè (All tab) - Memoized
const FriendsList = memo(function FriendsList({ friends, loading, onFriendClick, onAddFriendClick }: FriendsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
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
          <button
            onClick={onAddFriendClick}
            className="mt-6 px-6 py-2.5 bg-linear-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3C45A5] text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Add Friend
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-xs font-bold text-[#747F8D] uppercase tracking-wider px-2 mb-2">
        Tất cả bạn bè — {friends.length}
      </h3>
      <div className="space-y-1">
        {friends.map((friendItem) => (
          <div
            key={friendItem.friendshipId}
            onClick={() => onFriendClick(friendItem.friend.id)}
            className="flex items-center gap-3 p-3 hover:bg-[#E3E5E8] rounded-lg transition-colors cursor-pointer group"
          >
            {/* Avatar với status indicator */}
            <div className="relative shrink-0">
              <Avatar
                initial={friendItem.friend.username.charAt(0)}
                size="lg"
                hoverScale
              />
              <div className="absolute -bottom-0.5 -right-0.5">
                <StatusIndicator status="online" size="lg" />
              </div>
            </div>
            
            {/* Thông tin bạn bè */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold text-[#060607] truncate group-hover:text-[#5865F2] transition-colors">
                  {friendItem.friend.username}
                </h4>
              </div>
              <p className="text-sm text-[#747F8D] truncate">
                {friendItem.friend.email}
              </p>
            </div>
            
            {/* Icon message */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFriendClick(friendItem.friend.id);
              }}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#D1D9DE] transition-colors text-[#747F8D] hover:text-[#060607] opacity-0 group-hover:opacity-100 shrink-0"
            >
              <Icon src="chat.svg" className="w-5 h-5" size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

FriendsList.displayName = "FriendsList";

export default FriendsList;

