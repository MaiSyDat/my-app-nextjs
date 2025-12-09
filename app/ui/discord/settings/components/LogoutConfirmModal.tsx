/**
 * Component Modal xác nhận đăng xuất
 */

"use client";

import { useRouter } from "next/navigation";

interface LogoutConfirmModalProps {
  onCancel: () => void;
}

export default function LogoutConfirmModal({ onCancel }: LogoutConfirmModalProps) {
  const router = useRouter();

  // Xóa token và user khỏi localStorage, redirect về trang chủ
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

