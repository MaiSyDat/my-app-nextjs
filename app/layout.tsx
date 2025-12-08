/**
 * Root Layout của ứng dụng Next.js
 * 
 * Layout này:
 * - Định nghĩa metadata và fonts
 * - Import global CSS
 * - Wrap toàn bộ app với ToastProvider
 * - Cung cấp ToastContainer để hiển thị notifications
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./ui/toast/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Discord | Group chat that's all fun & games",
  description: "Discord is great for playing games and chilling with friends, or even building a worldwide community. Customize your own space to talk, play, and hang out.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
