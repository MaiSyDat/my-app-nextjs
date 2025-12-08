/**
 * Context quản lý Toast Notifications
 * 
 * Context này cung cấp:
 * - State quản lý danh sách toasts
 * - Functions để show/hide toasts (showSuccess, showError, showWarning)
 * - Auto-remove toasts sau một khoảng thời gian
 * - ToastContainer component để render toasts
 */

"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import ToastContainer from "./ToastContainer";
import type { Toast, ToastType } from "./Toast";

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Provider component để quản lý toasts
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Hàm đóng toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Hàm hiển thị toast
  const showToast = useCallback(
    (message: string, type: ToastType = "success", duration: number = 5000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  // Helper functions cho từng loại toast
  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast(message, "success", duration);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast(message, "error", duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, "warning", duration);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook để sử dụng toast
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

