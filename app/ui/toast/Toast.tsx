/**
 * Component hiển thị một Toast notification đơn lẻ
 * 
 * Component này:
 * - Hiển thị icon, message và close button
 * - Hỗ trợ 3 loại: success, error, warning
 * - Auto-remove sau duration (mặc định 3 giây)
 * - Animate khi mount/unmount
 * - Click để close manually
 */

"use client";

import { useEffect } from "react";
import Icon from "../common/Icon";

export type ToastType = "success" | "error" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

// Component hiển thị một toast notification
export default function ToastItem({ toast, onClose }: ToastProps) {
  const { id, message, type, duration = 5000 } = toast;

  // Tự động đóng toast sau duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  // Cấu hình màu sắc và icon theo type
  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-green-100",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          iconSrc: "check.svg",
        };
      case "error":
        return {
          bgColor: "bg-red-100",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          iconSrc: "close.svg",
        };
      case "warning":
        return {
          bgColor: "bg-yellow-100",
          borderColor: "border-yellow-200",
          iconColor: "text-yellow-600",
          iconSrc: "warning.svg",
        };
      default:
        return {
          bgColor: "bg-gray-100",
          borderColor: "border-gray-200",
          iconColor: "text-gray-600",
          iconSrc: null,
        };
    }
  };

  const config = getToastConfig();

  return (
    <div className="flex items-center max-w-sm w-full p-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg gap-x-3 transition-all duration-200 hover:shadow-xl">
      {/* Icon */}
      <div className={`flex items-center justify-center w-8 h-8 rounded-md ${config.bgColor} border ${config.borderColor} shrink-0 transition-transform duration-200`}>
        {config.iconSrc && (
          <Icon src={config.iconSrc} className={`w-4 h-4 ${config.iconColor}`} size={16} />
        )}
      </div>

      {/* Message */}
      <p className="text-sm text-gray-700 flex-1">{message}</p>

      {/* Close button */}
      <button
        onClick={() => onClose(id)}
        className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 p-1 rounded hover:bg-gray-100"
        aria-label="Close notification"
      >
        <Icon src="x.svg" className="w-4 h-4" size={16} />
      </button>
    </div>
  );
}

