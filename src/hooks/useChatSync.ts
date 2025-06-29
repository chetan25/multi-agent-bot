import { useEffect, useRef } from "react";
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
    chatConfig || {
      api: "/api/chat",
      id: "fallback-chat",
      body: {},
    }
  );

  // Sync currentMessages to useChat when they change
  useEffect(() => {
    if (messagesReady && currentMessages && setMessages && !isThreadSwitching) {
      const aiMessages = convertToAIMessages(currentMessages);
      setMessages(aiMessages);
    }
  }, [currentMessages, messagesReady, setMessages, isThreadSwitching]);

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
          }, 1000);
        } else {
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
    currentThread,
    user?.id,
    saveMessage,
    chatLoadingFromHook,
    currentMessages,
    isLoadingMessages,
    isThreadSwitching,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    };
  }, []);

  // Reset state when switching threads
  const resetSyncState = () => {
    savedMessageIds.current.clear();
    lastMessageLength.current = 0;
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
      streamingTimeoutRef.current = null;
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
