/**
 * Trang chủ (Landing page)
 * 
 * Trang này:
 * - Hiển thị landing page với thông tin về ứng dụng
 * - Button "Open Discord" để mở ứng dụng
 * - Redirect về /discord nếu đã đăng nhập, /login nếu chưa
 * - Route: /
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import Icon from "@/app/ui/common/Icon";

// Landing page với hero section và các tính năng
export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Handler cho nút Open Discord - check login trước khi redirect
  const handleOpenDiscord = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href = "/discord";
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-blue-800 to-purple-600 text-white overflow-x-hidden">
      {/* Navigation bar cố định */}
      <nav className="fixed top-0 w-full z-50 bg-linear-to-r from-blue-800/95 to-purple-600/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Image src="/logo/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8" />
            <span className="text-xl font-bold">Discord</span>
          </div>

          {/* Menu điều hướng */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#download" className="hover:text-gray-300 transition-colors">
              Download
            </a>
            <a href="#nitro" className="hover:text-gray-300 transition-colors">
              Nitro
            </a>
            <a href="#discover" className="hover:text-gray-300 transition-colors">
              Discover
            </a>
            <a href="#safety" className="hover:text-gray-300 transition-colors">
              Safety
            </a>
            <a href="#support" className="hover:text-gray-300 transition-colors">
              Support
            </a>
          </div>

          {/* Nút login và menu mobile */}
          <div className="flex items-center space-x-4">
            <a
              href="/login"
              onClick={handleOpenDiscord}
              className="px-4 py-2 bg-white text-blue-800 rounded-full font-medium hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
            >
              Open Discord
            </a>
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Icon src="menu.svg" className="w-6 h-6 text-white" size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Group chat that&apos;s all{" "}
            <span className="text-[#FEE75C]">fun & games</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Discord is great for playing games and chilling with friends, or
            even building a worldwide community. Customize your own space to
            talk, play, and hang out.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="px-8 py-4 bg-white text-blue-800 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2">
              <Icon src="download.svg" className="w-5 h-5 text-blue-800" size={20} />
              Download for Windows
            </button>
            <a
              href="/login"
              onClick={handleOpenDiscord}
              className="px-8 py-4 bg-[#23272A] text-white rounded-full font-semibold text-lg hover:bg-[#2C2F33] transition-all cursor-pointer"
            >
              Open Discord in your browser
            </a>
          </div>
        </div>
      </section>

      {/* Features Section 1 - Group chat */}
      <section className="py-20 px-6 bg-white text-gray-900">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Make your group chats more fun
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Use custom emoji, stickers, soundboard effects and more to add
              your personality to your voice, video, or text chat. Set your
              avatar and a custom status, and write your own profile to show up
              in chat your way.
            </p>
          </div>
          {/* Mockup UI */}
          <div className="relative">
            <div className="bg-linear-to-br from-purple-500 to-pink-500 rounded-lg p-8 shadow-2xl">
              <div className="bg-white rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500"></div>
                  <div>
                    <div className="h-3 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 w-24 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 2 - Streaming */}
      <section className="py-20 px-6 bg-[#F6F6F6] text-gray-900">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="bg-linear-to-br from-blue-500 to-cyan-500 rounded-lg p-8 shadow-2xl">
              <div className="bg-white rounded-lg p-6">
                <div className="aspect-video bg-gray-200 rounded mb-4"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Stream like you&apos;re in the same room
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              High quality and low latency streaming makes it feel like
              you&apos;re hanging out on the couch with friends while playing a
              game, watching shows, looking at photos, or idk doing homework or
              something.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section 3 - Voice chat */}
      <section className="py-20 px-6 bg-white text-gray-900">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Hop in when you&apos;re free, no need to call
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Easily hop in and out of voice or text chats without having to
              call or invite anyone, so your party chat lasts before, during,
              and after your game session.
            </p>
          </div>
          {/* Mockup UI */}
          <div className="relative">
            <div className="bg-linear-to-br from-green-500 to-emerald-500 rounded-lg p-8 shadow-2xl">
              <div className="bg-white rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-500"></div>
                    <div>
                      <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-16 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                  <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-[#23272A] text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-8">
            YOU CAN&apos;T SCROLL ANYMORE.
            <br />
            BETTER GO CHAT.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-purple-500 text-white rounded-full font-semibold text-lg hover:bg-purple-600 transition-all hover:scale-105 flex items-center justify-center gap-2">
              <Icon src="download.svg" className="w-5 h-5 text-white" size={20} />
              Download for Mac
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#23272A] border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Image src="/logo/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8" />
            <span className="text-2xl font-bold">Discord</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2025 Discord. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
