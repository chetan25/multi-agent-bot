"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Bot,
  User,
  Loader2,
  Settings,
  CheckCircle,
  MessageSquare,
  Paperclip,
  X,
} from "lucide-react";
import { ProviderSelector } from "./ProviderSelector";
import { FileUpload } from "./FileUpload";
import { FileDisplay } from "./FileDisplay";
import { ChatHeader } from "./ChatHeader";
import { ThreadDrawer } from "./ThreadDrawer";
import { useProviderConfigStore } from "@/lib/stores/providerConfigStore";
import { useSelectedProviderStore } from "@/lib/stores/selectedProviderStore";
import { useChatThreadStore } from "@/lib/stores/chatThreadStore";
import { useAuth } from "@/hooks/useAuth";
import { FileAttachment, ChatThread, ChatMessage } from "@/lib/types";

export function ChatComponent() {
  const { user } = useAuth();
  const { userProviders, getProviderConfig, isProviderConfigured } =
    useProviderConfigStore();

  const {
    selectedProvider,
    selectedModel,
    getCurrentProvider,
    getCurrentModel,
  } = useSelectedProviderStore();

  const {
    currentThread,
    currentMessages,
    createNewThread,
    loadThread,
    saveMessage,
  } = useChatThreadStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showThreadSuccessMessage, setShowThreadSuccessMessage] =
    useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [showThreadDrawer, setShowThreadDrawer] = useState(false);
  const hasShownSuccessRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const [providerChangeTimestamp, setProviderChangeTimestamp] = useState(0);
  const [chatKey, setChatKey] = useState(0);
  const [messagesReady, setMessagesReady] = useState(false);

  const currentProvider = getCurrentProvider();
  console.log("currentProvider", currentProvider);
  const currentModel = getCurrentModel();
  console.log("currentModel", currentModel);
  console.log("selectedProvider", selectedProvider);
  console.log("selectedModel", selectedModel);
  const isConfigured = currentProvider
    ? isProviderConfigured(currentProvider.id)
    : false;
  const providerConfig = currentProvider
    ? getProviderConfig(currentProvider.id)
    : undefined;

  // Check if current model supports vision
  const supportsVision = currentModel?.supportsVision || false;

  // Convert ChatMessage to AI SDK message format
  const convertToAIMessages = (messages: ChatMessage[]) => {
    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      attachments: msg.attachments,
    }));
  };

  // Convert AI SDK message to ChatMessage format
  const convertToChatMessage = (
    message: any
  ): Omit<ChatMessage, "id" | "createdAt"> => ({
    threadId: currentThread?.threadId || "",
    userId: user?.id || "",
    role: message.role,
    content: message.content,
    attachments: message.attachments,
  });

  // Only initialize useChat when a provider is configured and ready AND messages are ready
  const chatConfig =
    isConfigured && chatReady && providerConfig?.apiKey && messagesReady
      ? {
          api: "/api/chat",
          id: currentThread?.threadId || "new-chat",
          initialMessages: convertToAIMessages(currentMessages),
          body: {
            provider: selectedProvider,
            model: selectedModel,
            userApiKey: providerConfig.apiKey,
            attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
          },
          onError: (error: Error) => {
            console.error("==========================");
            console.error("Chat API Error:", error.message);
            console.error("Error details:", {
              provider: selectedProvider,
              model: selectedModel,
              hasApiKey: !!providerConfig?.apiKey,
              apiKeyLength: providerConfig?.apiKey?.length || 0,
              isConfigured,
              chatReady,
              attachmentCount: selectedFiles.length,
            });
            console.error("Current provider config:", providerConfig);
            console.error("==========================");
          },
          // Add a key to force reinitialization when provider/model changes or when creating new thread
          key: `${selectedProvider}-${selectedModel}-${currentThread?.threadId}-${chatKey}`,
        }
      : undefined;

  console.log("Chat config:", chatConfig);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoading,
    error,
  } = useChat(chatConfig);

  // Track saved messages to prevent duplicates
  const savedMessageIds = useRef<Set<string>>(new Set());
  const lastMessageLength = useRef<number>(0);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save messages to database when they change
  useEffect(() => {
    if (messages && messages.length > 0 && currentThread && user?.id) {
      const lastMessage = messages[messages.length - 1];

      // Skip if this is a system message or empty message
      if (lastMessage.role === "system" || !lastMessage.content.trim()) {
        return;
      }

      // For user messages, save immediately (they don't stream)
      if (lastMessage.role === "user") {
        const messageId = `user-${lastMessage.content}`;
        if (!savedMessageIds.current.has(messageId)) {
          console.log("Saving user message to database");
          savedMessageIds.current.add(messageId);

          saveMessage(convertToChatMessage(lastMessage))
            .then(() => {
              console.log("User message saved successfully");
            })
            .catch((error) => {
              console.error("Failed to save user message:", error);
              savedMessageIds.current.delete(messageId);
            });
        }
        return;
      }

      // For assistant messages, handle streaming
      if (lastMessage.role === "assistant") {
        const currentLength = lastMessage.content.length;
        const isStreaming =
          chatLoading || currentLength > lastMessageLength.current;

        console.log(`🔄 Assistant message streaming check:`, {
          currentLength,
          lastLength: lastMessageLength.current,
          chatLoading,
          isStreaming,
          content: lastMessage.content.substring(0, 50) + "...",
        });

        // Clear any existing timeout
        if (streamingTimeoutRef.current) {
          clearTimeout(streamingTimeoutRef.current);
        }

        if (isStreaming) {
          // Message is still streaming, update the length and set a timeout
          lastMessageLength.current = currentLength;
          console.log(
            `⏳ Message still streaming, length: ${currentLength}, setting timeout...`
          );

          // Set a timeout to save the message after streaming appears to be complete
          streamingTimeoutRef.current = setTimeout(() => {
            const finalMessage = messages[messages.length - 1];
            if (finalMessage.role === "assistant") {
              const messageId = `assistant-${finalMessage.content}`;
              if (!savedMessageIds.current.has(messageId)) {
                console.log(
                  "💾 Saving assistant message to database (streaming complete)"
                );
                savedMessageIds.current.add(messageId);

                saveMessage(convertToChatMessage(finalMessage))
                  .then(() => {
                    console.log("✅ Assistant message saved successfully");
                  })
                  .catch((error) => {
                    console.error(
                      "❌ Failed to save assistant message:",
                      error
                    );
                    savedMessageIds.current.delete(messageId);
                  });
              } else {
                console.log("⚠️ Assistant message already saved, skipping");
              }
            }
          }, 1000); // Wait 1 second after last content change to ensure streaming is complete
        } else {
          // Message is not streaming, save immediately
          const messageId = `assistant-${lastMessage.content}`;
          if (!savedMessageIds.current.has(messageId)) {
            console.log(
              "💾 Saving assistant message to database (not streaming)"
            );
            savedMessageIds.current.add(messageId);

            saveMessage(convertToChatMessage(lastMessage))
              .then(() => {
                console.log("✅ Assistant message saved successfully");
              })
              .catch((error) => {
                console.error("❌ Failed to save assistant message:", error);
                savedMessageIds.current.delete(messageId);
              });
          } else {
            console.log("⚠️ Assistant message already saved, skipping");
          }
        }
      }
    }
  }, [messages, currentThread, user?.id, saveMessage, chatLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    };
  }, []);

  // Handle thread selection
  const handleThreadSelect = async (thread: ChatThread) => {
    try {
      // Set thread switching state and mark messages as not ready
      setIsThreadSwitching(true);
      setMessagesReady(false);

      // Clear saved message IDs and streaming state when switching threads
      savedMessageIds.current.clear();
      lastMessageLength.current = 0;
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }

      // Load the thread messages first
      await loadThread(thread.threadId);
      console.log("✅ Thread messages loaded");

      // Mark messages as ready and force useChat hook to reinitialize with the loaded messages
      setMessagesReady(true);
      setChatKey((prev) => prev + 1);
      console.log("🔄 Forced useChat reinitialization for thread switch");
    } catch (error) {
      console.error("Failed to load thread:", error);
      setIsThreadSwitching(false);
      setMessagesReady(false);
    }
  };

  // Handle new thread creation
  const handleCreateNewThread = async () => {
    if (!user?.id) {
      alert("Please sign in to create a new chat.");
      return;
    }

    try {
      // Set thread switching state and mark messages as not ready
      setIsThreadSwitching(true);
      setMessagesReady(false);

      console.log("Creating new thread for user:", user.id);
      const newThread = await createNewThread(user.id);
      console.log("New thread created:", newThread);

      // Clear saved message IDs and streaming state for new thread
      savedMessageIds.current.clear();
      lastMessageLength.current = 0;
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }

      // Mark messages as ready (empty for new thread) and force useChat hook to reinitialize
      setMessagesReady(true);
      setChatKey((prev) => prev + 1);
      console.log("🔄 Forced useChat reinitialization for new thread");

      // Show success feedback
      setShowThreadSuccessMessage(true);
      setIsTransitioning(true);

      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowThreadSuccessMessage(false);
        setIsTransitioning(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to create new thread:", error);
      setIsThreadSwitching(false);
      setMessagesReady(false);
      alert(
        `Failed to create new chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Check if any provider is configured
  const hasAnyConfiguredProvider = userProviders.some((p) => p.isConfigured);
  console.log("Has any configured provider:", hasAnyConfiguredProvider);

  // Auto-create thread if none exists
  const ensureActiveThread = async () => {
    if (!user?.id || currentThread) {
      return; // User not authenticated or already has an active thread
    }

    try {
      console.log("No active thread found, creating one automatically...");
      await createNewThread(user.id);
      console.log("Auto-created thread for user:", user.id);
    } catch (error) {
      console.error("Failed to auto-create thread:", error);
    }
  };

  // Auto-create thread when user is authenticated and has no active thread
  useEffect(() => {
    if (user?.id && !currentThread && hasAnyConfiguredProvider) {
      ensureActiveThread();
    }
  }, [user?.id, currentThread, hasAnyConfiguredProvider]);

  // Debug logging for configuration state
  useEffect(() => {
    console.log("=== ChatComponent Debug ===");
    console.log("Current provider:", currentProvider?.name);
    console.log("Current model:", currentModel?.name);
    console.log("Is configured:", isConfigured);
    console.log("Provider config:", providerConfig);
    console.log("All user providers:", userProviders);
    console.log("Selected provider:", selectedProvider);
    console.log("Selected model:", selectedModel);
    console.log("Chat ready:", chatReady);
    console.log("Show settings:", showSettings);
    console.log("Supports vision:", supportsVision);
    console.log("Is initial load:", isInitialLoadRef.current);
    console.log("Current thread:", currentThread);
    console.log("Current messages count:", currentMessages.length);
    console.log("==========================");
  }, [
    currentProvider,
    currentModel,
    isConfigured,
    providerConfig,
    userProviders,
    selectedProvider,
    selectedModel,
    chatReady,
    showSettings,
    supportsVision,
    currentThread,
    currentMessages.length,
  ]);

  // Additional debug effect for provider changes
  useEffect(() => {
    console.log("🔄 Provider/Model Change Detected:");
    console.log("Provider ID:", selectedProvider);
    console.log("Model ID:", selectedModel);
    console.log("Provider Name:", currentProvider?.name);
    console.log("Model Name:", currentModel?.name);
    console.log("Supports Vision:", supportsVision);
  }, [
    selectedProvider,
    selectedModel,
    currentProvider?.name,
    currentModel?.name,
    supportsVision,
  ]);

  // Force re-render when config changes
  useEffect(() => {
    console.log("🔄 Config changed, forcing re-render");
    setProviderChangeTimestamp(Date.now());
  }, [selectedProvider, selectedModel]);

  // Track thread switching to ensure useChat shows correct messages
  const [isThreadSwitching, setIsThreadSwitching] = useState(false);

  useEffect(() => {
    if (isThreadSwitching && currentThread && currentMessages.length >= 0) {
      console.log(
        `🔄 Thread switch complete for ${currentThread.threadId}: ${currentMessages.length} messages`
      );
      setIsThreadSwitching(false);
    }
  }, [currentThread?.threadId, currentMessages.length, isThreadSwitching]);

  // Set messages ready when currentMessages are loaded (for initial load and auto-creation)
  useEffect(() => {
    if (currentThread && !isThreadSwitching) {
      console.log(
        `📊 Messages ready for thread ${currentThread.threadId}: ${currentMessages.length} messages`
      );
      setMessagesReady(true);
    }
  }, [currentThread?.threadId, currentMessages.length, isThreadSwitching]);

  // Set chat ready when provider is configured and data is loaded
  useEffect(() => {
    if (isConfigured) {
      setChatReady(true);
      console.log(
        "✅ Chat is now ready - Provider configured:",
        currentProvider?.name
      );
    } else {
      setChatReady(false);
      console.log(
        "❌ Chat is not ready - Provider not configured or still loading"
      );
    }
  }, [isConfigured, currentProvider?.name]);

  // Show success message when provider is configured for the first time (not on refresh)
  useEffect(() => {
    if (
      isConfigured &&
      !hasShownSuccessRef.current &&
      !isInitialLoadRef.current
    ) {
      // Only show success message if we haven't shown it yet for this configuration
      // AND it's not the initial load from localStorage
      setShowSuccessMessage(true);
      setIsTransitioning(true);
      hasShownSuccessRef.current = true;

      // Hide success message after 2 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
        setIsTransitioning(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConfigured]);

  // Mark initial load as complete after data is loaded
  useEffect(() => {
    // Since we're using Zustand with persist, we can assume data is loaded immediately
    isInitialLoadRef.current = false;
  }, []);

  // Reset success flag when provider changes
  useEffect(() => {
    hasShownSuccessRef.current = false;
  }, [currentProvider?.id]);

  // Store messages across provider switches
  const [persistentMessages, setPersistentMessages] = useState<any[]>([]);

  // Show provider switch notification
  const [showProviderSwitch, setShowProviderSwitch] = useState(false);
  const [lastProvider, setLastProvider] = useState<string | null>(null);

  useEffect(() => {
    if (
      currentProvider?.id &&
      lastProvider &&
      lastProvider !== currentProvider.id &&
      persistentMessages.length > 0
    ) {
      setShowProviderSwitch(true);
      setTimeout(() => setShowProviderSwitch(false), 3000);
    }
    setLastProvider(currentProvider?.id || null);
  }, [currentProvider?.id, lastProvider, persistentMessages.length]);

  // Provide fallbacks when useChat is not initialized
  const safeMessages = messages || persistentMessages || [];
  const safeInput = input || "";
  const safeHandleInputChange = handleInputChange || (() => {});
  const safeHandleSubmit = handleSubmit || (() => {});
  const safeChatLoading = chatLoading || false;

  const [isTyping, setIsTyping] = useState(false);

  // Force re-render when provider changes
  useEffect(() => {
    setProviderChangeTimestamp(Date.now());
  }, [selectedProvider, selectedModel]);

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
    if (!safeInput.trim() && selectedFiles.length === 0) {
      alert("Please enter a message or attach a file.");
      return;
    }

    // Auto-create thread if none exists
    if (!currentThread) {
      if (!user?.id) {
        alert("Please sign in to start chatting.");
        return;
      }

      try {
        console.log("No active thread, creating one automatically...");
        await createNewThread(user.id);
        // Wait a moment for the thread to be set as current
        setTimeout(() => {
          // Retry the submission
          onSubmit(e);
        }, 100);
        return;
      } catch (error) {
        console.error("Failed to auto-create thread:", error);
        alert("Failed to create chat thread. Please try again.");
        return;
      }
    }

    setIsTyping(true);
    try {
      // Use the AI SDK's handleSubmit
      await safeHandleSubmit(e);

      // Clear selected files after successful submission
      setSelectedFiles([]);
      setShowFileUpload(false);
    } catch (error) {
      console.error("Chat submission error:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileSelection = (files: FileAttachment[]) => {
    setSelectedFiles(files);
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Show loading state while data is being fetched from localStorage
  if (false) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              AI Chat Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
              <p className="text-gray-600">Loading your configuration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show configuration screen only if no provider is configured AND settings are not being shown
  if (!hasAnyConfiguredProvider && !showSettings) {
    return (
      <div className="w-full h-full flex flex-col space-y-4">
        <ChatHeader
          onMenuClick={() => setShowThreadDrawer(true)}
          onNewChat={handleCreateNewThread}
        />

        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              AI Chat Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-4">
                Configure an AI provider to start chatting
              </p>
              <Button
                onClick={() => setShowSettings(true)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure Provider
              </Button>
            </div>
          </CardContent>
        </Card>

        {showSettings && (
          <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl z-10">
            <CardHeader>
              <CardTitle className="text-lg">Provider Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderSelector />
            </CardContent>
          </Card>
        )}

        <ThreadDrawer
          isOpen={showThreadDrawer}
          onClose={() => setShowThreadDrawer(false)}
          onThreadSelect={handleThreadSelect}
          onCreateNewThread={handleCreateNewThread}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Chat Header */}
      <ChatHeader
        onMenuClick={() => setShowThreadDrawer(true)}
        onNewChat={handleCreateNewThread}
        currentThreadTitle={currentThread?.title}
      />

      {/* Success Message */}
      {showSuccessMessage && (
        <Card
          className={`border-green-200 bg-green-50 transition-all duration-500 flex-shrink-0 ${
            isTransitioning ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Provider configured successfully!
              </span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              You can now start chatting with {currentProvider?.name} -{" "}
              {currentModel?.name}
            </p>
          </CardContent>
        </Card>
      )}

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

      {/* Provider Switch Notification */}
      {showProviderSwitch && (
        <Card
          className={`border-blue-200 bg-blue-50 transition-all duration-500 flex-shrink-0`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Switched to {currentProvider?.name} - {currentModel?.name}
              </span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Your conversation context has been preserved. You can continue
              chatting with the new provider.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Provider Info */}
      <Card
        key={`provider-info-${currentProvider?.id}-${currentModel?.id}-${providerChangeTimestamp}`}
        className={`transition-all duration-300 flex-shrink-0 ${
          isTransitioning ? "transform translate-y-2" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-500" />
              {currentProvider?.name || "No Provider Selected"} -{" "}
              {currentModel?.name || "No Model Selected"}
              {supportsVision && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Vision Enabled
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 px-2"
            >
              <Settings className="h-3 w-3 mr-1" />
              {showSettings ? "Hide" : "Settings"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-gray-600">
            {currentModel?.description ||
              "Select a provider and model to start chatting"}
            {supportsVision && (
              <span className="block mt-1 text-green-600">
                ✓ Supports images and file attachments
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="transition-all duration-300 flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-lg">Provider Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <ProviderSelector />
          </CardContent>
        </Card>
      )}

      {/* Chat Interface - Show if any provider is configured */}
      {hasAnyConfiguredProvider && (
        <Card
          className={`flex flex-col h-[600px] transition-all duration-500 ${
            isTransitioning
              ? "transform translate-y-2 opacity-90"
              : "opacity-100"
          } ${chatReady ? "border-green-200" : ""}`}
        >
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Error occurred</p>
                    <p className="text-xs">
                      {error.message || "Failed to process message"}
                    </p>
                  </div>
                </div>
              )}

              {safeMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Start a conversation with the AI assistant</p>
                  <p className="text-sm">Ask me anything!</p>
                  {supportsVision && (
                    <p className="text-sm text-green-600 mt-2">
                      You can also send images and files
                    </p>
                  )}
                  {chatReady && (
                    <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-xs text-green-700">
                        ✅ Chat is ready! Type your message below.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                safeMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {safeChatLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* File Upload Panel */}
            {showFileUpload && supportsVision && (
              <div className="p-4 border-b">
                <FileUpload
                  onFilesSelected={handleFileSelection}
                  maxFiles={5}
                  maxFileSize={10}
                  disabled={safeChatLoading || !chatReady}
                />
              </div>
            )}

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">
                    Attachments ({selectedFiles.length})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                    className="h-6 px-2"
                  >
                    <X className="h-3 w-3" />
                    Clear All
                  </Button>
                </div>
                <FileDisplay attachments={selectedFiles} compact />
              </div>
            )}

            {/* Chat Input Area - Fixed at bottom */}
            <form onSubmit={onSubmit} className="p-4 flex-shrink-0">
              <div className="flex gap-2">
                {supportsVision && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    disabled={safeChatLoading || !chatReady}
                    className="px-3"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                )}
                <Input
                  value={safeInput}
                  onChange={safeHandleInputChange}
                  placeholder={
                    chatReady
                      ? supportsVision
                        ? "Type your message or attach files..."
                        : "Type your message..."
                      : "Chat input will be available after configuration..."
                  }
                  className="flex-1"
                  disabled={safeChatLoading || !chatReady}
                />
                <Button
                  type="submit"
                  disabled={
                    safeChatLoading ||
                    (!safeInput.trim() && selectedFiles.length === 0) ||
                    !chatReady
                  }
                  className={`px-4 ${
                    chatReady
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {chatReady && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Chat is ready!{" "}
                  {supportsVision && "You can send text, images, and files."}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

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
