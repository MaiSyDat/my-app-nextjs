"use client";

import DiscordLayout from "../ui/discord/DiscordLayout";
import AuthGuard from "../ui/discord/AuthGuard";

// Trang Discord được bảo vệ bởi AuthGuard
export default function DiscordPage() {
  return (
    <AuthGuard>
      <DiscordLayout />
    </AuthGuard>
  );
}

