import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "@/lib/types";

interface UseChatSyncProps {
  chatConfig: any;
  currentMessages: ChatMessage[];
  messagesReady: boolean;
  isThreadSwitching: boolean;
  currentThread: any;
  user: any;
  saveMessage: (message: any) => Promise<void>;
  chatLoading: boolean;
  isLoadingMessages: boolean;
}

export function useChatSync({
  chatConfig,
  currentMessages,
  messagesReady,
  isThreadSwitching,
  currentThread,
  user,
  saveMessage,
  chatLoading,
  isLoadingMessages,
}: UseChatSyncProps) {
  const savedMessageIds = useRef<Set<string>>(new Set());
  const lastMessageLength = useRef<number>(0);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Custom chat configuration with image handling
  const customChatConfig = chatConfig
    ? {
        ...chatConfig,
        onFinish: (message: any) => {
          // Check if this was an image generation request by looking at the message content
          const isImageGenerationRequest =
            (message.content &&
              message.content.includes("Generated") &&
              message.content.includes("image")) ||
            (message.content.includes("image") &&
              message.content.includes("based on your request"));

          if (isImageGenerationRequest) {
            // This was an image generation response, handle it specially
            console.log("Image generation completed:", message);
          } else {
            // Regular text generation
            console.log("Chat stream finished:", message);
          }
        },
      }
    : undefined;

  // Always call useChat to avoid React hooks violation
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoadingFromHook,
    error,
    setMessages,
  } = useChat(
    customChatConfig || {
      api: "/api/chat",
      id: currentThread?.threadId || "fallback-chat",
      body: {},
      key: currentThread?.threadId || "fallback-chat",
    }
  );

  // Sync currentMessages to useChat when they change
  useEffect(() => {
    if (messagesReady && currentMessages && setMessages) {
      const aiMessages = convertToAIMessages(currentMessages);
      console.log("🔄 Syncing database messages to useChat:", {
        currentMessagesCount: currentMessages.length,
        aiMessagesCount: aiMessages.length,
        messagesReady,
        isThreadSwitching,
      });
      setMessages(aiMessages);
    }
  }, [currentMessages, messagesReady, setMessages, isThreadSwitching]);

  // Filter out duplicate messages to prevent React key conflicts
  useEffect(() => {
    if (messages && messages.length > 0 && setMessages) {
      const seenIds = new Set<string>();
      const filteredMessages = messages.filter((message) => {
        // If we've seen this ID before, filter it out
        if (seenIds.has(message.id)) {
          console.log(
            "🚫 Filtering out duplicate message with ID:",
            message.id
          );
          return false;
        }
        seenIds.add(message.id);
        return true;
      });

      // Only update if we actually filtered something out
      if (filteredMessages.length !== messages.length) {
        console.log(
          `Filtered ${
            messages.length - filteredMessages.length
          } duplicate messages`
        );
        setMessages(filteredMessages);
      }
    }
  }, [messages, setMessages]);

  // Filter out duplicate user messages with attachments immediately
  useEffect(() => {
    if (messages && messages.length > 0 && setMessages) {
      const filteredMessages = messages.filter((message, index) => {
        // If this is a user message with attachments, check if it's a duplicate
        if (
          message.role === "user" &&
          (message as any).attachments &&
          (message as any).attachments.length > 0
        ) {
          // Only check for duplicates if this is the last message (most recent)
          if (index === messages.length - 1) {
            // Check if we already have this message in currentMessages
            const isDuplicate = currentMessages.some(
              (currentMsg) =>
                currentMsg.role === "user" &&
                currentMsg.content === message.content &&
                currentMsg.attachments &&
                currentMsg.attachments.length > 0
            );

            // If it's a duplicate, filter it out
            if (isDuplicate) {
              console.log(
                "🚫 Filtering out duplicate user message with attachments"
              );
              return false;
            }
          }
        }
        return true;
      });

      // Only update if we actually filtered something out
      if (filteredMessages.length !== messages.length) {
        setMessages(filteredMessages);
      }
    }
  }, [messages, currentMessages, setMessages]);

  // Save messages to database when they change
  useEffect(() => {
    if (messages && messages.length > 0 && currentThread && user?.id) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage.role === "system" || !lastMessage.content.trim()) {
        return;
      }

      if (isLoadingMessages || isThreadSwitching) {
        return;
      }

      // Check if message already exists in currentMessages
      const messageAlreadyExists = currentMessages.some(
        (msg) =>
          msg.content === lastMessage.content && msg.role === lastMessage.role
      );

      if (messageAlreadyExists) {
        return;
      }

      const messageToSave = convertToChatMessage(lastMessage);
      if (messageToSave.threadId !== currentThread.threadId) {
        return;
      }

      console.log(
        "💾 Saving message:",
        lastMessage.role,
        lastMessage.content.substring(0, 50),
        "hasAttachments:",
        !!(lastMessage as any).attachments,
        "attachmentCount:",
        (lastMessage as any).attachments?.length || 0
      );

      // Only save assistant messages here - user messages are saved in onSubmit
      // But we need to handle user messages without attachments
      if (lastMessage.role === "user") {
        // Check if this user message has attachments
        const hasAttachments =
          (lastMessage as any).attachments &&
          (lastMessage as any).attachments.length > 0;

        // Only save user messages without attachments here
        // User messages with attachments are already saved in onSubmit
        if (!hasAttachments) {
          const messageId = `user-${lastMessage.content}`;
          if (!savedMessageIds.current.has(messageId)) {
            savedMessageIds.current.add(messageId);
            saveMessage(convertToChatMessage(lastMessage))
              .then(() => console.log("✅ User message saved"))
              .catch((error) => {
                console.error("❌ Failed to save user message:", error);
                savedMessageIds.current.delete(messageId);
              });
          }
        }
      }

      if (lastMessage.role === "assistant") {
        const currentLength = lastMessage.content.length;
        const isStreaming =
          chatLoadingFromHook || currentLength > lastMessageLength.current;

        if (streamingTimeoutRef.current) {
          clearTimeout(streamingTimeoutRef.current);
        }

        if (isStreaming) {
          lastMessageLength.current = currentLength;
          streamingTimeoutRef.current = setTimeout(() => {
            const finalMessage = messages[messages.length - 1];
            if (finalMessage.role === "assistant") {
              const messageId = `assistant-${finalMessage.content}`;
              if (!savedMessageIds.current.has(messageId)) {
                savedMessageIds.current.add(messageId);
                saveMessage(convertToChatMessage(finalMessage))
                  .then(() => console.log("✅ Assistant message saved"))
                  .catch((error) => {
                    console.error(
                      "❌ Failed to save assistant message:",
                      error
                    );
                    savedMessageIds.current.delete(messageId);
                  });
              }
            }
          }, 1000); // Wait 1 second after streaming stops
        } else {
          // Message is complete, save immediately
          const messageId = `assistant-${lastMessage.content}`;
          if (!savedMessageIds.current.has(messageId)) {
            savedMessageIds.current.add(messageId);
            saveMessage(convertToChatMessage(lastMessage))
              .then(() => console.log("✅ Assistant message saved"))
              .catch((error) => {
                console.error("❌ Failed to save assistant message:", error);
                savedMessageIds.current.delete(messageId);
              });
          }
        }
      }
    }
  }, [
    messages,
    currentMessages,
    currentThread,
    user?.id,
    saveMessage,
    isLoadingMessages,
    isThreadSwitching,
    chatLoadingFromHook,
  ]);

  // Reset state when thread changes
  useEffect(() => {
    if (isThreadSwitching) {
      console.log("🔄 Resetting chat sync state due to thread switch");
      savedMessageIds.current.clear();
      lastMessageLength.current = 0;
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    }
  }, [isThreadSwitching]);

  // Reset state when currentThread changes
  useEffect(() => {
    console.log("🔄 Thread changed, resetting chat sync state:", {
      currentThreadId: currentThread?.threadId,
      isThreadSwitching,
    });
    savedMessageIds.current.clear();
    lastMessageLength.current = 0;
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
    }
  }, [currentThread?.threadId]);

  const resetSyncState = () => {
    savedMessageIds.current.clear();
    lastMessageLength.current = 0;
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
    }
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoadingFromHook,
    error,
    setMessages,
    resetSyncState,
  };
}
