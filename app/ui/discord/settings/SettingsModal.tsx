"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SettingsTab = "account" | "privacy" | "connections" | "billing" | "nitro" | "logout";

// Simple Discord-like settings modal with sidebar tabs and logout confirm
export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSelectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (tab === "logout") {
      setShowLogoutConfirm(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative flex w-[960px] h-[560px] bg-[#FFFFFF] rounded-lg shadow-2xl overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-[#F7F8F9] flex flex-col">
          <div className="px-4 py-4 border-b border-[#E3E5E8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center">
                <span className="text-white text-xs font-semibold">U</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#060607]">User</div>
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
            {activeTab === "account" && (
              <p className="text-sm text-[#747F8D]">
                Demo account settings page. You can customize this content later.
              </p>
            )}
            {activeTab === "privacy" && (
              <p className="text-sm text-[#747F8D]">
                Demo privacy & safety settings.
              </p>
            )}
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

function SettingsItem({
  label,
  active,
  onClick,
  danger,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left text-sm rounded-r-full transition-colors ${
        active
          ? "bg-[#E3E5E8] text-[#060607]"
          : danger
          ? "text-red-500 hover:bg-[#E3E5E8] hover:text-red-600"
          : "text-[#747F8D] hover:bg-[#E3E5E8] hover:text-[#060607]"
      }`}
    >
      {label}
    </button>
  );
}

function LogoutConfirmModal({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[420px] bg-[#FFFFFF] rounded-lg shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-[#060607] mb-2">Log Out</h3>
        <p className="text-sm text-[#747F8D] mb-6">
          Are you sure you want to log out?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded bg-[#E3E5E8] text-[#060607] hover:bg-[#D1D9DE] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm rounded bg-[#D83C3E] text-white hover:bg-[#F04747] transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}


