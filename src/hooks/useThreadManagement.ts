import { useState, useEffect, useRef } from "react";
import { ChatThread } from "@/lib/types";

interface UseThreadManagementProps {
  user: any;
  currentThread: any;
  currentMessages: any[];
  hasAnyConfiguredProvider: boolean;
  createNewThread: (userId: string) => Promise<ChatThread>;
  loadThread: (threadId: string) => Promise<void>;
  threadLoading: boolean;
}

export function useThreadManagement({
  user,
  currentThread,
  currentMessages,
  hasAnyConfiguredProvider,
  createNewThread,
  loadThread,
  threadLoading,
}: UseThreadManagementProps) {
  const [isThreadSwitching, setIsThreadSwitching] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesReady, setMessagesReady] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const fetchedThreadsRef = useRef<Set<string>>(new Set());

  // Auto-create thread if none exists
  const ensureActiveThread = async () => {
    if (!user?.id || currentThread) {
      return;
    }

    try {
      await createNewThread(user.id);
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

  // Fetch messages on initial load, refresh, and thread change
  useEffect(() => {
    if (
      user?.id &&
      currentThread &&
      !isThreadSwitching &&
      !threadLoading &&
      !fetchedThreadsRef.current.has(currentThread.threadId)
    ) {
      console.log("🔄 Fetching messages for thread:", currentThread.threadId);
      setIsLoadingMessages(true);
      fetchedThreadsRef.current.add(currentThread.threadId);

      loadThread(currentThread.threadId)
        .then(() => {
          console.log(
            "✅ Messages fetched successfully for thread:",
            currentThread.threadId
          );
          setMessagesReady(true);
          setIsLoadingMessages(false);
        })
        .catch((error) => {
          console.error(
            "❌ Failed to fetch messages for thread:",
            currentThread.threadId,
            error
          );
          fetchedThreadsRef.current.delete(currentThread.threadId);
          setIsLoadingMessages(false);
        });
    }
  }, [user?.id, currentThread?.threadId, isThreadSwitching, threadLoading]);

  // Handle thread selection
  const handleThreadSelect = async (thread: ChatThread) => {
    try {
      console.log("🔄 Switching to thread:", thread.threadId);
      setIsThreadSwitching(true);
      setMessagesReady(false);
      setIsLoadingMessages(true);

      // Remove from fetched threads to ensure fresh fetch
      fetchedThreadsRef.current.delete(thread.threadId);

      await loadThread(thread.threadId);
      setMessagesReady(true);
      setIsLoadingMessages(false);
      setIsThreadSwitching(false);
      setChatKey((prev) => prev + 1);
      console.log("✅ Successfully switched to thread:", thread.threadId);
    } catch (error) {
      console.error("❌ Failed to load thread:", error);
      setIsThreadSwitching(false);
      setMessagesReady(false);
      setIsLoadingMessages(false);
    }
  };

  // Handle new thread creation
  const handleCreateNewThread = async () => {
    if (!user?.id) {
      alert("Please sign in to create a new chat.");
      return;
    }

    try {
      console.log("🔄 Creating new thread");
      setIsThreadSwitching(true);
      setMessagesReady(false);
      setIsLoadingMessages(true);

      const newThread = await createNewThread(user.id);
      setMessagesReady(true);
      setIsLoadingMessages(false);
      setIsThreadSwitching(false);
      setChatKey((prev) => prev + 1);
      console.log("✅ Successfully created new thread:", newThread.threadId);
    } catch (error) {
      console.error("❌ Failed to create new thread:", error);
      setIsThreadSwitching(false);
      setMessagesReady(false);
      setIsLoadingMessages(false);
      alert(
        `Failed to create new chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return {
    isThreadSwitching,
    isLoadingMessages,
    messagesReady,
    chatKey,
    handleThreadSelect,
    handleCreateNewThread,
  };
}
