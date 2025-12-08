/**
 * Component Container hiển thị danh sách Toast notifications
 * 
 * Component này:
 * - Render tất cả toasts từ ToastContext
 * - Position fixed ở góc trên bên phải
 * - Animate khi thêm/xóa toasts
 * - Z-index cao để hiển thị trên tất cả elements
 */

"use client";

import ToastItem, { type Toast } from "./Toast";

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

// Container quản lý danh sách toasts
export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-in slide-in-from-top-5 fade-in-0 duration-300"
        >
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

