/**
 * Layout chung cho tất cả Discord routes
 * 
 * Layout này:
 * - Bảo vệ bằng AuthGuard
 * - Cung cấp các providers (FriendsProvider, UnreadMessagesProvider, UserStatusProvider)
 * - Cung cấp DiscordLayout cho tất cả routes con
 * 
 * Routes sử dụng layout này:
 * - /channels/me
 * - /nitro
 * - /store
 */

"use client";

import DiscordLayout from "../ui/discord/layout/DiscordLayout";
import AuthGuard from "../ui/discord/auth/AuthGuard";
import { FriendsProvider } from "@/app/contexts/FriendsContext";
import { UnreadMessagesProvider } from "@/app/contexts/UnreadMessagesContext";
import { UserStatusProvider } from "@/app/contexts/UserStatusContext";

export default function DiscordRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <UserStatusProvider>
        <FriendsProvider>
          <UnreadMessagesProvider>
            <DiscordLayout />
          </UnreadMessagesProvider>
        </FriendsProvider>
      </UserStatusProvider>
    </AuthGuard>
  );
}

