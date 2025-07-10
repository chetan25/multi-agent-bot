"use client";

import { ChatHeader } from "./ChatHeader";
import { ThreadDrawer } from "./ThreadDrawer";
import { ConfigurationComponent } from "./ConfigurationComponent";

interface ConfigureProviderViewProps {
  showThreadDrawer: boolean;
  setShowThreadDrawer: (show: boolean) => void;
  onMenuClick: () => void;
  onNewChat: () => void;
  onThreadSelect: (thread: any) => void;
  onCreateNewThread: () => void;
}

export function ConfigureProviderView({
  showThreadDrawer,
  setShowThreadDrawer,
  onMenuClick,
  onNewChat,
  onThreadSelect,
  onCreateNewThread,
}: ConfigureProviderViewProps) {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Fixed Header */}
      <ChatHeader onMenuClick={onMenuClick} onNewChat={onNewChat} />

      {/* Configuration Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="w-full max-w-4xl mx-auto h-full">
          <ConfigurationComponent />
        </div>
      </div>

      {/* Thread Drawer */}
      <ThreadDrawer
        isOpen={showThreadDrawer}
        onClose={() => setShowThreadDrawer(false)}
        onThreadSelect={onThreadSelect}
        onCreateNewThread={onCreateNewThread}
      />
    </div>
  );
}
