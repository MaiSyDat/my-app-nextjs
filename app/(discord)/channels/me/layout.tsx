/**
 * Layout cho /channels/me routes
 * 
 * Layout này không cần render gì vì:
 * - AuthGuard và Providers đã được đặt ở (discord)/layout.tsx
 * - DiscordLayout đã được render ở (discord)/layout.tsx
 */

export default function ChannelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return null;
}

