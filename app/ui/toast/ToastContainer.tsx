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

import { useState, useEffect } from "react";
import ToastItem, { type Toast } from "./Toast";

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

// Container quản lý danh sách toasts
export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  const [visibleToasts, setVisibleToasts] = useState<Set<string>>(new Set());
  const [exitingToasts, setExitingToasts] = useState<Set<string>>(new Set());

  // Xử lý animation khi toast xuất hiện
  useEffect(() => {
    toasts.forEach((toast) => {
      if (!visibleToasts.has(toast.id)) {
        // Delay nhỏ để trigger animation
        setTimeout(() => {
          setVisibleToasts((prev) => new Set(prev).add(toast.id));
        }, 10);
      }
    });
  }, [toasts, visibleToasts]);

  // Xử lý animation khi toast biến mất
  const handleClose = (id: string) => {
    setExitingToasts((prev) => new Set(prev).add(id));
    // Đợi animation hoàn thành trước khi remove
    setTimeout(() => {
      onClose(id);
      setVisibleToasts((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setExitingToasts((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
      {toasts.map((toast) => {
        const isVisible = visibleToasts.has(toast.id);
        const isExiting = exitingToasts.has(toast.id);
        
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto transition-all duration-300 ease-in-out ${
              isVisible && !isExiting
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-full"
            }`}
          >
            <ToastItem toast={toast} onClose={handleClose} />
          </div>
        );
      })}
    </div>
  );
}

