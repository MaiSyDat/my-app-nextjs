"use client";

import { useState } from "react";
import ServerList from "./ServerList";
import ChannelSidebar from "./ChannelSidebar";
import MessageArea from "./MessageArea";
import RightSidebar from "./RightSidebar";
import SettingsModal from "./settings/SettingsModal";
import TopBar from "./TopBar";

// Discord main layout with 3 columns, top bar, and settings modal
export default function DiscordLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string>("friends");

  return (
    <>
      <div className="flex h-screen bg-linear-to-br from-[#FFFFFF] via-[#F7F8F9] to-[#F2F3F5] text-[#060607] overflow-hidden flex-col">
        {/* Top bar cố định full width ở trên tất cả */}
        <TopBar title={activeItem} />

        {/* Main content area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Column 1: server list */}
          <ServerList />

          {/* Column 2: channels + messages */}
          <div className="flex flex-1 min-w-0">
            <ChannelSidebar
              onOpenSettings={() => setIsSettingsOpen(true)}
              onActiveItemChange={setActiveItem}
            />
            <MessageArea activeItem={activeItem} />
          </div>

          {/* Column 3: right sidebar */}
          <RightSidebar activeItem={activeItem} />
        </div>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}


