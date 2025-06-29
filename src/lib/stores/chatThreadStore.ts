import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatThread, ChatMessage } from "../types";
import { chatService } from "../chatService";

interface ChatThreadState {
  // State
  threads: ChatThread[];
  currentThread: ChatThread | null;
  currentMessages: ChatMessage[]; // Not persisted - always fetched fresh from server
  loading: boolean;
  error: string | null;

  // Actions
  loadUserThreads: (userId: string) => Promise<void>;
  createNewThread: (userId: string, title?: string) => Promise<ChatThread>;
  loadThread: (threadId: string) => Promise<void>;
  saveMessage: (
    message: Omit<ChatMessage, "id" | "createdAt">
  ) => Promise<void>;
  updateThreadTitle: (threadId: string, title: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  clearCurrentThread: () => void;
  setError: (error: string | null) => void;
}

export const useChatThreadStore = create<ChatThreadState>()(
  persist(
    (set, get) => ({
      // Initial state
      threads: [],
      currentThread: null,
      currentMessages: [],
      loading: false,
      error: null,

      // Load all threads for a user
      loadUserThreads: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          const threads = await chatService.getUserThreads(userId);
          set({ threads, loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to load threads",
            loading: false,
          });
        }
      },

      // Create a new thread
      createNewThread: async (userId: string, title?: string) => {
        set({ loading: true, error: null });
        try {
          const newThread = await chatService.createThread({ userId, title });
          set((state) => ({
            threads: [newThread, ...state.threads],
            currentThread: newThread,
            currentMessages: [],
            loading: false,
          }));
          return newThread;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to create thread",
            loading: false,
          });
          throw error;
        }
      },

      // Load a specific thread and its messages (always fetch fresh)
      loadThread: async (threadId: string) => {
        set({ loading: true, error: null });
        try {
          const [thread, messages] = await Promise.all([
            chatService.getThread(threadId),
            chatService.getThreadMessages(threadId),
          ]);

          if (!thread) {
            throw new Error("Thread not found");
          }

          set({
            currentThread: thread,
            currentMessages: messages,
            loading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to load thread",
            loading: false,
          });
        }
      },

      // Save a message to the current thread (don't persist locally)
      saveMessage: async (message: Omit<ChatMessage, "id" | "createdAt">) => {
        const { currentThread } = get();
        if (!currentThread) {
          throw new Error("No active thread");
        }

        try {
          const savedMessage = await chatService.saveMessage({
            threadId: currentThread.threadId,
            userId: message.userId,
            role: message.role,
            content: message.content,
            attachments: message.attachments,
          });

          // Update local state with the saved message (but don't persist)
          set((state) => ({
            currentMessages: [...state.currentMessages, savedMessage],
            threads: state.threads.map((thread) =>
              thread.threadId === currentThread.threadId
                ? {
                    ...thread,
                    messageCount: thread.messageCount + 1,
                    updatedAt: new Date().toISOString(),
                  }
                : thread
            ),
          }));

          // Update current thread with new stats
          set((state) => ({
            currentThread: state.currentThread
              ? {
                  ...state.currentThread,
                  messageCount: state.currentThread.messageCount + 1,
                  updatedAt: new Date().toISOString(),
                }
              : null,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to save message",
          });
          throw error;
        }
      },

      // Update thread title
      updateThreadTitle: async (threadId: string, title: string) => {
        try {
          await chatService.updateThreadTitle(threadId, title);
          set((state) => ({
            threads: state.threads.map((thread) =>
              thread.threadId === threadId ? { ...thread, title } : thread
            ),
            currentThread:
              state.currentThread?.threadId === threadId
                ? { ...state.currentThread, title }
                : state.currentThread,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update thread title",
          });
          throw error;
        }
      },

      // Delete a thread
      deleteThread: async (threadId: string) => {
        try {
          await chatService.deleteThread(threadId);
          set((state) => ({
            threads: state.threads.filter(
              (thread) => thread.threadId !== threadId
            ),
            currentThread:
              state.currentThread?.threadId === threadId
                ? null
                : state.currentThread,
            currentMessages:
              state.currentThread?.threadId === threadId
                ? []
                : state.currentMessages,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to delete thread",
          });
          throw error;
        }
      },

      // Clear current thread
      clearCurrentThread: () => {
        set({ currentThread: null, currentMessages: [] });
      },

      // Set error
      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: "chat-thread-store",
      version: 3,
      partialize: (state) => ({
        threads: state.threads,
        currentThread: state.currentThread,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("🔄 Chat thread store rehydrated:", {
            threadCount: state.threads.length,
            currentThread: state.currentThread?.threadId,
          });

          state.currentMessages = [];
        }
      },
      migrate: (persistedState: any, version: number) => {
        console.log("🔄 Migrating chat thread store from version:", version);

        if (version < 3) {
          console.log(
            "🔄 Migrating from version that stored messages - clearing messages for fresh fetch"
          );

          return {
            threads: persistedState.threads || [],
            currentThread: persistedState.currentThread || null,
          };
        }

        return persistedState;
      },
    }
  )
);
