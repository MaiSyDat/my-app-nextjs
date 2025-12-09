/**
 * Redirect từ /discord về /channels/me
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DiscordPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/channels/me");
  }, [router]);
  
  return null;
}

