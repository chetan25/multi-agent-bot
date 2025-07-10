"use client";

import { useState, useEffect } from "react";

import { ConfigureProviderView } from "./ConfigureProviderView";
import { ChatWithConfigurationView } from "./ChatWithConfigurationView";
import { useConfigurationStore } from "@/lib/stores/configurationStore";
import { useSessionManager } from "@/lib/sessionManager";

export function ChatComponent() {
  const { user } = useSessionManager();
  const { hasAnyConfiguredProvider } = useConfigurationStore();

  const [showThreadDrawer, setShowThreadDrawer] = useState(false);

  // Enhanced thread handlers with success feedback
  const handleThreadSelectWithFeedback = async (thread: any) => {
    // This will be handled by the ChatWithConfigurationView component
  };

  const handleCreateNewThreadWithFeedback = async () => {
    // This will be handled by the ChatWithConfigurationView component
  };

  // Show configuration screen only if no provider is configured
  if (!hasAnyConfiguredProvider) {
    return (
      <ConfigureProviderView
        showThreadDrawer={showThreadDrawer}
        setShowThreadDrawer={setShowThreadDrawer}
        onMenuClick={() => setShowThreadDrawer(true)}
        onNewChat={handleCreateNewThreadWithFeedback}
        onThreadSelect={handleThreadSelectWithFeedback}
        onCreateNewThread={handleCreateNewThreadWithFeedback}
      />
    );
  }

  return (
    <ChatWithConfigurationView
      showThreadDrawer={showThreadDrawer}
      setShowThreadDrawer={setShowThreadDrawer}
      onMenuClick={() => setShowThreadDrawer(true)}
      onNewChat={handleCreateNewThreadWithFeedback}
      onThreadSelect={handleThreadSelectWithFeedback}
      onCreateNewThread={handleCreateNewThreadWithFeedback}
    />
  );
}
