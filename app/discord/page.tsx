/**
 * Trang Discord chính
 * 
 * Trang này:
 * - Được bảo vệ bởi AuthGuard (redirect về /login nếu chưa đăng nhập)
 * - Hiển thị DiscordLayout với tất cả các components
 * - Route: /discord
 */

"use client";

import DiscordLayout from "../ui/discord/layout/DiscordLayout";
import AuthGuard from "../ui/discord/auth/AuthGuard";
export default function DiscordPage() {
  return (
    <AuthGuard>
      <DiscordLayout />
    </AuthGuard>
  );
}

