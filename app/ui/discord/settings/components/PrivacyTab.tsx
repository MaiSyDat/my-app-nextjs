/**
 * Component Tab Privacy - Cài đặt quyền riêng tư và thông báo
 */

"use client";

import { usePushNotifications } from "@/app/hooks/usePushNotifications";

export default function PrivacyTab() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[#060607] mb-2">Push Notifications</h3>
        <div className="bg-[#F7F8F9] rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#060607]">Desktop Notifications</p>
              <p className="text-xs text-[#747F8D] mt-1">
                Receive desktop notifications for new messages
              </p>
            </div>
            {isSupported ? (
              <button
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={isLoading}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isSubscribed
                    ? "bg-[#F23F42] hover:bg-[#E03E41] text-white"
                    : "bg-[#5865F2] hover:bg-[#4752C4] text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading
                  ? "Processing..."
                  : isSubscribed
                  ? "Disable Notifications"
                  : "Enable Notifications"}
              </button>
            ) : (
              <p className="text-xs text-[#747F8D]">
                Browser not supported
              </p>
            )}
          </div>
          {isSubscribed && (
            <div className="pt-2 border-t border-[#E3E5E8]">
              <p className="text-xs text-[#23A559] flex items-center gap-1">
                <span className="w-2 h-2 bg-[#23A559] rounded-full"></span>
                Notifications enabled
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

