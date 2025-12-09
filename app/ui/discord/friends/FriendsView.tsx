/**
 * Component hiển thị Friends view với tabs
 * 
 * Component này hiển thị:
 * - Tab "All": Danh sách tất cả bạn bè
 * - Tab "Pending": Danh sách lời mời kết bạn đang chờ
 * - Add Friend button để mở modal thêm bạn
 * - Chuyển đổi giữa các tabs
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Icon from "../../common/Icon";
import FriendsList from "./FriendsList";
import PendingRequestsList from "./PendingRequestsList";
import AddFriendModal from "./AddFriendModal";
import { useFriendsContext } from "@/app/contexts/FriendsContext";
import { useToast } from "@/app/ui/toast";

interface FriendsViewProps {
  onActiveItemChange?: (item: string) => void;
}

/**
 * Component hiển thị Friends view với tabs All và Pending
 * Sử dụng useFriends hook để quản lý state tập trung
 */
export default function FriendsView({ onActiveItemChange }: FriendsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);

  // Sử dụng FriendsContext để quản lý state
  const {
    friends,
    pendingRequests,
    loading,
    error,
    acceptRequest,
    rejectRequest,
  } = useFriendsContext();

  // Sử dụng toast để hiển thị thông báo
  const { showError, showSuccess } = useToast();

  // Restore activeTab từ localStorage khi mount
  useEffect(() => {
    const savedTab = localStorage.getItem("discord_activeTab");
    if (savedTab === "all" || savedTab === "pending") {
      setActiveTab(savedTab);
    }
  }, []);

  // Save activeTab vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem("discord_activeTab", activeTab);
  }, [activeTab]);

  /**
   * Xử lý chấp nhận lời mời kết bạn
   */
  const handleAcceptRequest = useCallback(async (friendshipId: string) => {
    const success = await acceptRequest(friendshipId);
    if (success) {
      showSuccess("Friend request accepted!");
      // Tự động chuyển sang tab "all" để thấy bạn bè mới
      setActiveTab("all");
    } else {
      showError(error || "Unable to accept friend request");
    }
  }, [acceptRequest, showSuccess, showError, error]);

  /**
   * Xử lý từ chối lời mời kết bạn
   */
  const handleRejectRequest = useCallback(async (friendshipId: string) => {
    const success = await rejectRequest(friendshipId);
    if (success) {
      showSuccess("Friend request declined");
    } else {
      showError(error || "Unable to decline friend request");
    }
  }, [rejectRequest, showSuccess, showError, error]);

  /**
   * Xử lý khi click vào bạn bè để mở chat
   */
  const handleFriendClick = useCallback((friendId: string) => {
    router.push(`/channels/me/${friendId}`);
    onActiveItemChange?.(`user-${friendId}`);
  }, [onActiveItemChange, router]);

  return (
    <>
      <div className="flex-1 flex flex-col bg-linear-to-br from-[#FFFFFF] via-[#F7F8F9] to-[#F2F3F5]">
        {/* Header with Friends label and buttons */}
        <div className="h-12 px-4 flex items-center border-b border-[#E3E5E8] bg-linear-to-r from-[#FFFFFF] to-[#F7F8F9] shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#5865F2]/20 group-hover:bg-[#5865F2]/30 transition-colors">
              <Icon src="chat.svg" className="w-5 h-5 text-[#5865F2]" size={20} />
            </div>
            <h2 className="text-base font-bold text-[#060607]">Friends</h2>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "all"
                  ? "text-white bg-[#5865F2]"
                  : "text-[#060607] bg-[#E3E5E8] hover:bg-[#D1D9DE]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "pending"
                  ? "text-white bg-[#5865F2]"
                  : "text-[#060607] bg-[#E3E5E8] hover:bg-[#D1D9DE]"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setIsAddFriendOpen(true)}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-[#23A559] hover:bg-[#1E8E4A] rounded-lg transition-colors"
            >
              Add Friend
            </button>
          </div>
        </div>

        {/* Content area - hiển thị theo tab */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === "pending" ? (
            <PendingRequestsList
              requests={pendingRequests}
              loading={loading}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
            />
          ) : (
            <FriendsList
              friends={friends}
              loading={loading}
              onFriendClick={handleFriendClick}
              onAddFriendClick={() => setIsAddFriendOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Modal Add Friend */}
      {isAddFriendOpen && (
        <AddFriendModal
          onClose={() => setIsAddFriendOpen(false)}
          onSuccess={() => {
            setIsAddFriendOpen(false);
          }}
        />
      )}
    </>
  );
}
