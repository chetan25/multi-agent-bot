"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { ThreadDrawer } from "./ThreadDrawer";
import { ConfigurationComponent } from "./ConfigurationComponent";
import { MessagesComponent } from "./MessagesComponent";
import { ChatInputComponent } from "./ChatInputComponent";
import { useConfigurationStore } from "@/lib/stores/configurationStore";
import { useChatThreadStore } from "@/lib/stores/chatThreadStore";
import { useAuth } from "@/hooks/useAuth";
import { useChatSync } from "@/hooks/useChatSync";
import { useThreadManagement } from "@/hooks/useThreadManagement";
import { FileAttachment } from "@/lib/types";

export function ChatComponent() {
  const { user } = useAuth();
  const {
    currentProvider,
    currentModel,
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

  const [showThreadSuccessMessage, setShowThreadSuccessMessage] =
    useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [showThreadDrawer, setShowThreadDrawer] = useState(false);
  const [providerChangeTimestamp, setProviderChangeTimestamp] = useState(0);

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

  // Only initialize useChat when a provider is configured and ready AND messages are ready
  const chatConfig =
    isConfigured && chatReady && providerConfig?.apiKey && messagesReady
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
            attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
            userId: user?.id,
          },
          onError: (error: Error) => {
            console.error("Chat API Error:", error.message);
          },
          onFinish: (message: any) => {
            // Handle any final processing when the stream is complete
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
    chatLoading: false, // We'll use the one from the hook
    isLoadingMessages,
  });

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
  }, [selectedProvider, selectedModel]);

  // Enhanced thread handlers with success feedback
  const handleThreadSelectWithFeedback = async (thread: any) => {
    resetSyncState();
    if (setMessages) {
      setMessages([]);
    }
    await handleThreadSelect(thread);
  };

  const handleCreateNewThreadWithFeedback = async () => {
    resetSyncState();
    if (setMessages) {
      setMessages([]);
    }
    await handleCreateNewThread();

    // Show success feedback
    setShowThreadSuccessMessage(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setShowThreadSuccessMessage(false);
      setIsTransitioning(false);
    }, 2000);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isConfigured) {
      alert("Please configure an AI provider first.");
      return;
    }
    if (!chatReady) {
      alert("Chat is not ready yet. Please wait a moment.");
      return;
    }
    if (!providerConfig?.apiKey) {
      alert("API key is missing. Please configure your provider.");
      return;
    }
    if (!input.trim() && selectedFiles.length === 0) {
      alert("Please enter a message or attach a file.");
      return;
    }

    if (!currentThread) {
      if (!user?.id) {
        alert("Please sign in to start chatting.");
        return;
      }

      try {
        await createNewThread(user.id);
        setTimeout(() => {
          onSubmit(e);
        }, 100);
        return;
      } catch (error) {
        console.error("Failed to auto-create thread:", error);
        alert("Failed to create chat thread. Please try again.");
        return;
      }
    }

    try {
      // Ensure user is authenticated
      if (!user?.id) {
        alert("Please sign in to send messages.");
        return;
      }

      // Save the user message with attachments to the database first
      if (selectedFiles.length > 0 || input.trim()) {
        const userMessage = {
          threadId: currentThread.threadId,
          userId: user.id,
          role: "user" as const,
          content: input.trim(),
          attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
        };

        console.log("💾 Saving user message with attachments:", {
          content: userMessage.content,
          attachmentCount: selectedFiles.length,
          attachments: selectedFiles,
        });

        await saveMessage(userMessage);
      }

      // Convert FileAttachment[] to the format expected by useChat
      const attachments =
        selectedFiles.length > 0
          ? selectedFiles.map((file) => ({
              name: file.name,
              contentType: file.type,
              url: file.url || `data:${file.type};base64,${file.data}`,
            }))
          : undefined;

      await handleSubmit(e, {
        experimental_attachments: attachments,
      });

      // Clear selected files after successful submission
      setSelectedFiles([]);
    } catch (error) {
      console.error("Chat submission error:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleFileSelection = (files: FileAttachment[]) => {
    setSelectedFiles(files);
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Calculate overall loading state
  const isLoading =
    !user?.id ||
    threadLoading ||
    isThreadSwitching ||
    isLoadingMessages ||
    !messagesReady ||
    !chatReady ||
    (user?.id && !currentThread && hasAnyConfiguredProvider);

  // Convert useChat messages to ChatMessage format for rendering
  const renderMessages =
    messages?.length > 0
      ? messages
          .filter((msg) => msg.role === "user" || msg.role === "assistant")
          .map((msg, index) => {
            // Check if this is an assistant message that should have image attachments
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
      : currentMessages || [];

  // Provide fallbacks when useChat is not initialized
  const safeMessages = renderMessages;
  const safeInput = input || "";
  const safeHandleInputChange = handleInputChange || (() => {});
  const safeChatLoading = chatLoading || false;

  // Show configuration screen only if no provider is configured
  if (!hasAnyConfiguredProvider) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Fixed Header */}
        <ChatHeader
          onMenuClick={() => setShowThreadDrawer(true)}
          onNewChat={handleCreateNewThreadWithFeedback}
        />

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
          onThreadSelect={handleThreadSelectWithFeedback}
          onCreateNewThread={handleCreateNewThreadWithFeedback}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Fixed Header */}
      <ChatHeader
        onMenuClick={() => setShowThreadDrawer(true)}
        onNewChat={handleCreateNewThreadWithFeedback}
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
                      {!user?.id
                        ? "Loading user data..."
                        : user?.id && !currentThread && hasAnyConfiguredProvider
                        ? "Creating initial chat thread..."
                        : threadLoading
                        ? "Loading thread..."
                        : isThreadSwitching
                        ? "Switching thread..."
                        : isLoadingMessages
                        ? "Loading messages..."
                        : !chatReady
                        ? "Initializing chat..."
                        : "Loading..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              {!isLoading && (
                <>
                  <MessagesComponent
                    messages={safeMessages}
                    isLoading={false}
                    error={error}
                    supportsVision={supportsVision}
                    chatReady={chatReady}
                  />

                  {/* Chat Input */}
                  <ChatInputComponent
                    input={safeInput}
                    onInputChange={safeHandleInputChange}
                    onSubmit={onSubmit}
                    isLoading={safeChatLoading}
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
        onThreadSelect={handleThreadSelectWithFeedback}
        onCreateNewThread={handleCreateNewThreadWithFeedback}
      />
    </div>
  );
}
