/**
 * Component Modal cài đặt
 * 
 * Component này:
 * - Hiển thị thông tin user hiện tại
 * - Button để đăng xuất
 * - Close modal khi click outside hoặc ESC
 * - Redirect về /login sau khi đăng xuất
 */

"use client";

import { useState, useEffect } from "react";
import SettingsItem from "./components/SettingsItem";
import LogoutConfirmModal from "./components/LogoutConfirmModal";
import AccountTab from "./components/AccountTab";
import PrivacyTab from "./components/PrivacyTab";

type SettingsTab = "account" | "privacy" | "connections" | "billing" | "nitro" | "logout";

// Simple Discord-like settings modal with sidebar tabs and logout confirm
export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // State để lưu thông tin user đã đăng nhập
  const [user, setUser] = useState<{
    username: string;
    email: string;
    id: string;
    displayName?: string | null;
    avatar?: string | null;
  } | null>(null);

  // Lấy thông tin user từ localStorage khi component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          const userId = parsedUser.id || parsedUser._id;
          if (userId) {
            // Fetch full user data để lấy displayName và avatar
            const response = await fetch(`/api/users/${userId}`);
            if (response.ok) {
              const data = await response.json();
              setUser({
                username: data.user.username || "",
                email: data.user.email || "",
                id: data.user.id || userId,
                displayName: data.user.displayName || null,
                avatar: data.user.avatar || null,
              });
            } else {
              // Fallback to localStorage data
              setUser({
                username: parsedUser.username || "",
                email: parsedUser.email || "",
                id: userId,
                displayName: parsedUser.displayName || null,
                avatar: parsedUser.avatar || null,
              });
            }
          }
        } catch (error) {
          // Silent fail
        }
      }
    };
    fetchUserData();
  }, []);

  // Lấy chữ cái đầu của username cho avatar
  const getInitials = (username: string) => {
    if (!username) return "U";
    return username.charAt(0).toUpperCase();
  };

  // Chọn tab và hiển thị logout confirm nếu chọn logout
  const handleSelectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (tab === "logout") {
      setShowLogoutConfirm(true);
    }
  };

  // Cập nhật user state khi user được update từ AccountTab
  const handleUserUpdate = (updatedUser: any) => {
    setUser({
      username: updatedUser.username || user?.username || "",
      email: updatedUser.email || user?.email || "",
      id: updatedUser.id || user?.id || "",
      displayName: updatedUser.displayName || null,
      avatar: updatedUser.avatar || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative flex w-[960px] h-[560px] bg-[#FFFFFF] rounded-lg shadow-2xl overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-[#F7F8F9] flex flex-col">
          <div className="px-4 py-4 border-b border-[#E3E5E8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-semibold">
                    {user ? getInitials(user.displayName || user.username) : "U"}
                  </span>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#060607]">
                  {user ? (user.displayName || user.username) : "User"}
                </div>
                <div className="text-xs text-[#747F8D]">Account</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <SettingsItem
              label="My Account"
              active={activeTab === "account"}
              onClick={() => handleSelectTab("account")}
            />
            <SettingsItem
              label="Privacy & Safety"
              active={activeTab === "privacy"}
              onClick={() => handleSelectTab("privacy")}
            />
            <SettingsItem
              label="Connections"
              active={activeTab === "connections"}
              onClick={() => handleSelectTab("connections")}
            />
            <SettingsItem
              label="Billing"
              active={activeTab === "billing"}
              onClick={() => handleSelectTab("billing")}
            />

            <div className="h-px my-3 bg-[#E3E5E8]" />

            <SettingsItem
              label="Nitro"
              active={activeTab === "nitro"}
              onClick={() => handleSelectTab("nitro")}
            />

            <div className="h-px my-3 bg-[#E3E5E8]" />

            <SettingsItem
              label="Log Out"
              active={activeTab === "logout"}
              onClick={() => handleSelectTab("logout")}
              danger
            />
          </div>

          <button
            onClick={onClose}
            className="h-10 mx-3 mb-3 rounded bg-[#E3E5E8] text-sm text-[#747F8D] hover:text-[#060607] hover:bg-[#D1D9DE] transition-colors"
          >
            Close
          </button>
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col bg-[#FFFFFF]">
          <div className="h-16 px-8 flex items-center border-b border-[#E3E5E8]">
            <h2 className="text-xl font-semibold text-[#060607]">
              {activeTab === "account" && "My Account"}
              {activeTab === "privacy" && "Privacy & Safety"}
              {activeTab === "connections" && "Connections"}
              {activeTab === "billing" && "Billing Settings"}
              {activeTab === "nitro" && "Nitro"}
              {activeTab === "logout" && "Log Out"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            {activeTab === "account" && <AccountTab user={user} onUserUpdate={handleUserUpdate} />}
            {activeTab === "privacy" && <PrivacyTab />}
            {activeTab === "connections" && (
              <p className="text-sm text-[#747F8D]">
                Demo connections settings.
              </p>
            )}
            {activeTab === "billing" && (
              <p className="text-sm text-[#747F8D]">
                Demo billing settings.
              </p>
            )}
            {activeTab === "nitro" && (
              <p className="text-sm text-[#747F8D]">
                Demo Nitro page.
              </p>
            )}
            {activeTab === "logout" && (
              <p className="text-sm text-[#747F8D]">
                To log out, confirm the action in the dialog.
              </p>
            )}
          </div>
        </div>

        {/* Close button top-right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#747F8D] hover:text-[#060607] hover:bg-[#E3E5E8] w-8 h-8 rounded-full flex items-center justify-center"
        >
          <span className="text-lg leading-none">×</span>
        </button>

        {showLogoutConfirm && (
          <LogoutConfirmModal
            onCancel={() => setShowLogoutConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}
