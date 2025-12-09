/**
 * Component hiển thị danh sách server bên trái
 * 
 * Component này:
 * - Hiển thị Discord logo và server icons
 * - Active state cho server đang được chọn
 * - Hover effects và transitions
 * - Ẩn trên mobile (responsive)
 */

"use client";

import { useState, memo, useMemo, useCallback } from "react";
import Image from "next/image";
import Icon from "../../common/Icon";

// Left sidebar showing Discord-style server icons - Memoized
const ServerList = memo(function ServerList() {
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [hoveredServer, setHoveredServer] = useState<string | null>(null);

  const servers = useMemo(() => [
    { id: "home", icon: "discord", isHome: true },
    { id: "1", icon: "S", name: "Server 1" },
    { id: "2", icon: "H", name: "Server 2" },
    { id: "3", icon: "M", name: "Server 3" },
    { id: "4", icon: "T", name: "Server 4" },
    { id: "5", icon: "D", name: "Server 5" },
  ], []);

  // Xử lý click vào server: set selectedServer để hiển thị active indicator
  const handleServerClick = useCallback((serverId: string) => {
    setSelectedServer(serverId);
  }, []);

  // Xử lý hover: set hoveredServer để hiển thị hover indicator
  const handleMouseEnter = useCallback((serverId: string) => {
    setHoveredServer(serverId);
  }, []);

  // Xử lý mouse leave: reset hoveredServer
  const handleMouseLeave = useCallback(() => {
    setHoveredServer(null);
  }, []);

  return (
    <div className="w-[72px] bg-[#F7F8F9] flex flex-col items-center py-3 gap-2 overflow-y-auto custom-scrollbar">
      {/* Discord home button */}
      <button
        onClick={() => handleServerClick("home")}
        className="w-12 h-12 flex items-center justify-center mb-2"
      >
        <Image src="/logo/logo.png" alt="Logo" width={24} height={24} className="w-6 h-6" />
      </button>

      {/* Divider */}
      <div className="w-8 h-0.5 bg-[#E3E5E8] rounded-full mb-1"></div>

      {/* Server icons */}
      {servers.slice(1).map((server) => (
        <button
          key={server.id}
          onClick={() => handleServerClick(server.id)}
          onMouseEnter={() => handleMouseEnter(server.id)}
          onMouseLeave={handleMouseLeave}
          className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center group relative
            ${
              selectedServer === server.id
                ? "bg-[#5865F2] rounded-2xl"
                : hoveredServer === server.id
                ? "bg-[#5865F2] rounded-2xl"
                : "bg-[#E3E5E8] hover:bg-[#5865F2] hover:rounded-2xl"
            }`}
          title={server.name}
        >
          <span className="text-[#060607] font-semibold text-lg transition-transform group-hover:scale-110">
            {server.icon}
          </span>
          {/* Active indicator */}
          {selectedServer === server.id && (
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#5865F2] rounded-r-full animate-pulse"></div>
          )}
          {/* Hover indicator */}
          {hoveredServer === server.id && selectedServer !== server.id && (
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#5865F2] rounded-r-full"></div>
          )}
        </button>
      ))}

      {/* Add server button */}
      <button
        className="w-12 h-12 rounded-full bg-[#E3E5E8] hover:bg-[#23A559] hover:rounded-2xl transition-all duration-200 flex items-center justify-center group mt-2"
        title="Add a Server"
      >
        <Icon src="plus.svg" className="w-6 h-6 text-[#23A559] group-hover:text-white transition-colors" size={24} />
      </button>

      {/* Explore servers button */}
      <button
        className="w-12 h-12 rounded-full bg-[#E3E5E8] hover:bg-[#5865F2] hover:rounded-2xl transition-all duration-200 flex items-center justify-center group"
        title="Explore Public Servers"
      >
        <Icon src="search.svg" className="w-6 h-6 text-[#23A559] group-hover:text-white transition-colors" size={24} />
      </button>
    </div>
  );
});

ServerList.displayName = "ServerList";

export default ServerList;

