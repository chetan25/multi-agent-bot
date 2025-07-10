"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { ThreadDrawer } from "./ThreadDrawer";
import { ConfigurationComponent } from "./ConfigurationComponent";
import { MessagesComponent } from "./MessagesComponent";
import { ChatInputComponent } from "./ChatInputComponent";
import { FileAttachment } from "@/lib/types";
import { useConfigurationStore } from "@/lib/stores/configurationStore";
import { useChatThreadStore } from "@/lib/stores/chatThreadStore";
import { useSessionManager } from "@/lib/sessionManager";
import { useChatSync } from "@/hooks/useChatSync";
import { useThreadManagement } from "@/hooks/useThreadManagement";

interface ChatWithConfigurationViewProps {
  // Thread drawer state
  showThreadDrawer: boolean;
  setShowThreadDrawer: (show: boolean) => void;

  // Event handlers
  onMenuClick: () => void;
  onNewChat: () => void;
  onThreadSelect: (thread: any) => void;
  onCreateNewThread: () => void;
}

export function ChatWithConfigurationView({
  showThreadDrawer,
  setShowThreadDrawer,
  onMenuClick,
  onNewChat,
  onThreadSelect,
  onCreateNewThread,
}: ChatWithConfigurationViewProps) {
  // Get user and stores
  const { user } = useSessionManager();
  const {
    currentProvider,
    isConfigured,
    hasAnyConfiguredProvider,
    supportsVision,
    supportsImageGeneration,
    providerConfig,
    selectedProvider,
    selectedModel,
  } = useConfigurationStore();

  const {
    currentThread,
    currentMessages,
    createNewThread,
    loadThread,
    saveMessage,
    loading: threadLoading,
  } = useChatThreadStore();

  // Thread management hook
  const {
    isThreadSwitching,
    isLoadingMessages,
    messagesReady,
    chatKey,
    handleThreadSelect,
    handleCreateNewThread,
  } = useThreadManagement({
    user,
    currentThread,
    currentMessages,
    hasAnyConfiguredProvider,
    createNewThread,
    loadThread,
    threadLoading,
  });

  // Chat configuration
  const chatConfig =
    isConfigured && providerConfig?.apiKey && messagesReady
      ? {
          api: "/api/chat",
          id: currentThread?.threadId || "new-chat",
          initialMessages: currentMessages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            attachments: msg.attachments,
          })),
          body: {
            provider: selectedProvider,
            model: selectedModel,
            userApiKey: providerConfig.apiKey,
            userId: user?.id,
          },
          onError: (error: Error) => {
            console.error("Chat API Error:", error.message);
          },
          onFinish: (message: any) => {
            console.log("Chat stream finished:", message);
          },
          key: `${selectedProvider}-${selectedModel}-${currentThread?.threadId}-${chatKey}`,
        }
      : undefined;

  // Chat sync hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoading,
    error,
    setMessages,
    resetSyncState,
  } = useChatSync({
    chatConfig,
    currentMessages,
    messagesReady,
    isThreadSwitching,
    currentThread,
    user,
    saveMessage,
    chatLoading: false,
    isLoadingMessages,
  });

  // Calculate overall loading state
  const isLoading =
    !user?.id ||
    threadLoading ||
    isThreadSwitching ||
    isLoadingMessages ||
    !messagesReady ||
    chatLoading;

  // Helper function to get loading message
  const getLoadingMessage = () => {
    if (!user?.id) return "Loading user data...";
    if (user?.id && !currentThread && hasAnyConfiguredProvider)
      return "Creating initial chat thread...";
    if (threadLoading) return "Loading thread...";
    if (isThreadSwitching) return "Switching thread...";
    if (isLoadingMessages) return "Loading messages...";
    return "Loading...";
  };

  // Simple onSubmit handler that delegates to handleSubmit
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleSubmit(e);
  };

  // Convert useChat messages to ChatMessage format for rendering
  const renderMessages = (() => {
    // Get database messages
    const dbMessages = currentMessages || [];

    // If we're switching threads or loading messages, only show database messages
    if (isThreadSwitching || isLoadingMessages || !messagesReady) {
      console.log("🔄 Rendering only database messages during thread switch:", {
        dbMessagesCount: dbMessages.length,
        isThreadSwitching,
        isLoadingMessages,
        messagesReady,
        currentThreadId: currentThread?.threadId,
      });
      return dbMessages;
    }

    // Convert useChat messages to ChatMessage format
    const useChatMessages =
      messages?.length > 0
        ? messages
            .filter((msg) => msg.role === "user" || msg.role === "assistant")
            .map((msg, index) => {
              const messageAttachments = (msg as any).attachments || [];
              return {
                id: msg.id || `temp-${index}`,
                threadId: currentThread?.threadId || "",
                userId: user?.id || "",
                role: msg.role as "user" | "assistant",
                content: msg.content,
                attachments: messageAttachments,
                createdAt: new Date().toISOString(),
              };
            })
        : [];

    // Merge messages, prioritizing useChat messages for recent ones
    const allMessages = [...dbMessages, ...useChatMessages];

    // Remove duplicates based on content and role (not just ID)
    const uniqueMessages = allMessages.filter((msg, index, arr) => {
      const firstIndex = arr.findIndex(
        (m) =>
          m.content === msg.content &&
          m.role === msg.role &&
          m.threadId === msg.threadId
      );
      return firstIndex === index;
    });

    // Sort by creation time
    const sortedMessages = uniqueMessages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    console.log("🔄 Rendering merged messages:", {
      dbMessagesCount: dbMessages.length,
      useChatMessagesCount: useChatMessages.length,
      uniqueMessagesCount: uniqueMessages.length,
      sortedMessagesCount: sortedMessages.length,
      currentThreadId: currentThread?.threadId,
    });

    return sortedMessages;
  })();

  // Internal state management
  const [showThreadSuccessMessage, setShowThreadSuccessMessage] =
    useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [providerChangeTimestamp, setProviderChangeTimestamp] = useState(0);

  // Set chat ready when provider is configured and data is loaded
  useEffect(() => {
    if (isConfigured) {
      setChatReady(true);
    } else {
      setChatReady(false);
    }
  }, [isConfigured, currentProvider?.name]);

  // Force re-render when provider changes
  useEffect(() => {
    setProviderChangeTimestamp(Date.now());
  }, [currentProvider?.name]);

  // Enhanced thread handlers with success feedback
  const handleCreateNewThreadWithFeedback = async () => {
    await onCreateNewThread();

    // Show success feedback
    setShowThreadSuccessMessage(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setShowThreadSuccessMessage(false);
      setIsTransitioning(false);
    }, 2000);
  };

  const handleFileSelection = (files: FileAttachment[]) => {
    setSelectedFiles(files);
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };
  return (
    <div className="w-full h-full flex flex-col">
      {/* Fixed Header */}
      <ChatHeader
        onMenuClick={onMenuClick}
        onNewChat={handleCreateNewThread}
        currentThreadTitle={currentThread?.title}
      />

      {/* Fixed Configuration Area */}
      <div className="flex-shrink-0 p-4">
        <div className="w-full max-w-4xl mx-auto space-y-4">
          {/* Thread Success Message */}
          {showThreadSuccessMessage && (
            <Card
              className={`border-green-200 bg-green-50 transition-all duration-500 flex-shrink-0 ${
                isTransitioning ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    New thread created successfully!
                  </span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  You can now start chatting with the new thread.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Configuration Component */}
          <ConfigurationComponent />
        </div>
      </div>

      {/* Scrollable Chat Area */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="w-full max-w-4xl mx-auto h-full">
          {/* Chat Interface */}
          <Card
            className={`flex flex-col h-full min-h-[600px] transition-all duration-500 ${
              isTransitioning
                ? "transform translate-y-2 opacity-90"
                : "opacity-100"
            } ${chatReady ? "border-green-200" : ""}`}
          >
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Loading Spinner */}
              {isLoading && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
                    <p className="text-gray-600 text-sm">
                      {getLoadingMessage()}
                    </p>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              {!isLoading && (
                <>
                  <MessagesComponent
                    messages={renderMessages}
                    isLoading={false}
                    error={error}
                    supportsVision={supportsVision}
                    chatReady={chatReady}
                  />

                  {/* Chat Input */}
                  <ChatInputComponent
                    input={input}
                    onInputChange={handleInputChange}
                    onSubmit={onSubmit}
                    isLoading={chatLoading}
                    chatReady={chatReady}
                    supportsVision={supportsVision}
                    supportsImageGeneration={supportsImageGeneration}
                    selectedFiles={selectedFiles}
                    onFilesSelected={handleFileSelection}
                    onRemoveFile={removeFile}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Thread Drawer */}
      <ThreadDrawer
        isOpen={showThreadDrawer}
        onClose={() => setShowThreadDrawer(false)}
        onThreadSelect={handleThreadSelect}
        onCreateNewThread={handleCreateNewThread}
      />
    </div>
  );
}
