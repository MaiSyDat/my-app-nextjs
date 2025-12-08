/**
 * Component hiển thị danh sách lời mời kết bạn đang chờ (Pending tab)
 * 
 * Component này:
 * - Hiển thị danh sách pending friend requests
 * - Buttons để Accept hoặc Reject request
 * - Empty state khi chưa có pending requests
 * - Loading state khi đang fetch
 */

"use client";

import { memo } from "react";
import Icon from "../../common/Icon";
import Avatar from "../../common/Avatar";

interface PendingRequest {
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    email: string;
  };
  status: string;
  requestedBy: any;
  createdAt: Date;
}

interface PendingRequestsListProps {
  requests: PendingRequest[];
  loading: boolean;
  onAccept: (friendshipId: string) => void;
  onReject: (friendshipId: string) => void;
}

// Component hiển thị danh sách lời mời kết bạn (Pending tab) - Memoized
const PendingRequestsList = memo(function PendingRequestsList({ requests, loading, onAccept, onReject }: PendingRequestsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5865F2]"></div>
      </div>
    );
  }

  if (requests.length === 0) {
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
            Không có lời mời kết bạn nào.
          </h3>
          <p className="text-[#747F8D] text-sm leading-relaxed">
            Bạn không có lời mời kết bạn nào đang chờ xử lý.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-xs font-bold text-[#747F8D] uppercase tracking-wider px-2 mb-2">
        Lời mời kết bạn — {requests.length}
      </h3>
      {requests.map((request) => (
        <div
          key={request.friendshipId}
          className="flex items-center gap-3 p-3 bg-[#F7F8F9] hover:bg-[#E3E5E8] rounded-lg transition-colors"
        >
          {/* Avatar */}
          <Avatar
            initial={request.friend.username.charAt(0)}
            size="xl"
          />
          
          {/* Thông tin user */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-[#060607] truncate">
                {request.friend.username}
              </h4>
            </div>
            <p className="text-sm text-[#747F8D] truncate">
              {request.friend.email}
            </p>
          </div>
          
          {/* Nút Accept/Reject */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onAccept(request.friendshipId)}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-linear-to-r from-[#23A559] to-[#1E8E4A] hover:from-[#1E8E4A] hover:to-[#1A7A3F] rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Chấp nhận
            </button>
            <button
              onClick={() => onReject(request.friendshipId)}
              className="px-4 py-1.5 text-sm font-semibold text-[#060607] bg-[#E3E5E8] hover:bg-[#D1D9DE] rounded-lg transition-all duration-200 shadow-md"
            >
              Từ chối
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

PendingRequestsList.displayName = "PendingRequestsList";

export default PendingRequestsList;

