/**
 * Custom Hook để quản lý Push Notifications
 * 
 * Hook này cung cấp:
 * - Request permission từ user
 * - Subscribe/Unsubscribe push notifications
 * - Lưu subscription vào database
 * - Register service worker
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/app/ui/toast";
import { getUserIdFromStorage } from "@/app/lib/utils";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  // Kiểm tra browser support và subscription khi mount
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      console.log("[Push] Browser supports push notifications");
      
      // Check subscription ngay sau khi set supported
      const checkSubscription = async () => {
        try {
          // Đảm bảo service worker đã được register
          let registration;
          try {
            registration = await navigator.serviceWorker.getRegistration("/sw.js");
            if (!registration) {
              // Nếu chưa có, register service worker
              registration = await navigator.serviceWorker.register("/sw.js");
            }
          } catch (error) {
            // Nếu lỗi, thử register lại
            registration = await navigator.serviceWorker.register("/sw.js");
          }
          
          const subscription = await registration.pushManager.getSubscription();
          console.log("[Push] Current subscription:", subscription ? "Found" : "None");
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error("[Push] Error checking subscription:", error);
          setIsSubscribed(false);
        }
      };
      
      checkSubscription();
    }
  }, []);

  // Request permission và subscribe
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      showError("Trình duyệt của bạn không hỗ trợ Push Notifications");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");

      // 2. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showError("Bạn cần cho phép thông báo để nhận notifications");
        setIsLoading(false);
        return;
      }

      // 3. Lấy VAPID public key
      const response = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await response.json();

      if (!publicKey) {
        throw new Error("VAPID public key not found");
      }

      // 4. Subscribe với PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // 5. Lưu subscription vào database
      const userId = getUserIdFromStorage();
      if (!userId) {
        throw new Error("User not found");
      }

      console.log("[Push] Saving subscription to database...");
      console.log("[Push] UserId:", userId);
      console.log("[Push] Endpoint:", subscription.endpoint);

      const saveResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
              auth: arrayBufferToBase64(subscription.getKey("auth")!),
            },
          },
          userId,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        console.error("[Push] Failed to save subscription:", errorData);
        throw new Error(errorData.message || "Failed to save subscription");
      }

      const saveData = await saveResponse.json();
      console.log("[Push] Subscription saved:", saveData);

      setIsSubscribed(true);
      showSuccess("Đã bật thông báo thành công!");
      
      // Log để debug
      console.log("[Push] Subscribed successfully:", subscription.endpoint);
    } catch (error: any) {
      console.error("[Push] Error subscribing:", error);
      showError("Không thể bật thông báo. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, showSuccess, showError]);

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe từ PushManager
        await subscription.unsubscribe();

        // Xóa khỏi database
        const userId = getUserIdFromStorage();
        if (userId) {
          await fetch("/api/push/unsubscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              userId,
            }),
          });
        }

        setIsSubscribed(false);
        showSuccess("Đã tắt thông báo");
      }
    } catch (error: any) {
      console.error("[Push] Error unsubscribing:", error);
      showError("Không thể tắt thông báo. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, showSuccess, showError]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}

// Helper function: Convert VAPID key từ base64 sang Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper function: Convert ArrayBuffer sang base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

