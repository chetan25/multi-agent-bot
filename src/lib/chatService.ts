import { createClient } from "./supabase-client";
import {
  ChatThread,
  ChatMessage,
  CreateThreadRequest,
  SaveMessageRequest,
} from "./types";

export class ChatService {
  private supabase = createClient();

  // Create a new chat thread
  async createThread(request: CreateThreadRequest): Promise<ChatThread> {
    // Get all existing threads for this user to find the next sequential number
    const { data: existingThreads, error: fetchError } = await this.supabase
      .from("chat_threads")
      .select("threadId")
      .eq("userId", request.userId)
      .order("createdAt", { ascending: true });

    if (fetchError) {
      throw new Error(
        `Failed to fetch existing threads: ${fetchError.message}`
      );
    }

    // Calculate the next thread number
    let nextThreadNumber = 1;
    if (existingThreads && existingThreads.length > 0) {
      // Extract numbers from existing thread IDs and find the highest
      const threadNumbers = existingThreads
        .map((thread) => {
          const parts = thread.threadId.split("-");
          const numberPart = parts[parts.length - 1];
          return parseInt(numberPart) || 0;
        })
        .filter((num) => !isNaN(num) && num > 0);

      if (threadNumbers.length > 0) {
        nextThreadNumber = Math.max(...threadNumbers) + 1;
      }
    }

    const threadId = `${request.userId}-${nextThreadNumber}`;
    const title = request.title || `Chat ${nextThreadNumber}`;

    console.log(`Creating new thread: ${threadId} for user: ${request.userId}`);

    const { data, error } = await this.supabase
      .from("chat_threads")
      .insert({
        userId: request.userId,
        threadId,
        title,
        messageCount: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Thread creation error:", error);
      throw new Error(`Failed to create thread: ${error.message}`);
    }

    console.log(`Successfully created thread: ${threadId}`);
    return data as ChatThread;
  }

  // Get all threads for a user
  async getUserThreads(userId: string): Promise<ChatThread[]> {
    const { data, error } = await this.supabase
      .from("chat_threads")
      .select("*")
      .eq("userId", userId)
      .order("updatedAt", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch threads: ${error.message}`);
    }

    return data as ChatThread[];
  }

  // Get a specific thread
  async getThread(threadId: string): Promise<ChatThread | null> {
    const { data, error } = await this.supabase
      .from("chat_threads")
      .select("*")
      .eq("threadId", threadId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Thread not found
      }
      throw new Error(`Failed to fetch thread: ${error.message}`);
    }

    return data as ChatThread;
  }

  // Get all messages for a thread
  async getThreadMessages(threadId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from("chat_messages")
      .select("*")
      .eq("threadId", threadId)
      .order("createdAt", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return data as ChatMessage[];
  }

  // Save a message to a thread
  async saveMessage(request: SaveMessageRequest): Promise<ChatMessage> {
    // Check for duplicate messages to prevent multiple saves
    const { data: existingMessages } = await this.supabase
      .from("chat_messages")
      .select("id")
      .eq("threadId", request.threadId)
      .eq("role", request.role)
      .eq("content", request.content)
      .order("createdAt", { ascending: false })
      .limit(1);

    // If a similar message exists and was created recently (within last 5 seconds), skip saving
    if (existingMessages && existingMessages.length > 0) {
      console.log("Duplicate message detected, skipping save");
      // Return the existing message instead of creating a new one
      const { data: existingMessage } = await this.supabase
        .from("chat_messages")
        .select("*")
        .eq("id", existingMessages[0].id)
        .single();

      return existingMessage as ChatMessage;
    }

    console.log("Saving new message to database:", {
      threadId: request.threadId,
      role: request.role,
      contentLength: request.content.length,
    });

    const { data, error } = await this.supabase
      .from("chat_messages")
      .insert({
        threadId: request.threadId,
        userId: request.userId,
        role: request.role,
        content: request.content,
        attachments: request.attachments || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Message save error:", error);
      throw new Error(`Failed to save message: ${error.message}`);
    }

    console.log("Message saved successfully with ID:", data.id);

    // Update thread's message count and updatedAt
    await this.updateThreadStats(request.threadId);

    return data as ChatMessage;
  }

  // Update thread statistics (message count and updatedAt)
  private async updateThreadStats(threadId: string): Promise<void> {
    // Get message count
    const { count } = await this.supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("threadId", threadId);

    // Update thread
    await this.supabase
      .from("chat_threads")
      .update({
        messageCount: count || 0,
        updatedAt: new Date().toISOString(),
      })
      .eq("threadId", threadId);
  }

  // Update thread title
  async updateThreadTitle(threadId: string, title: string): Promise<void> {
    const { error } = await this.supabase
      .from("chat_threads")
      .update({ title })
      .eq("threadId", threadId);

    if (error) {
      throw new Error(`Failed to update thread title: ${error.message}`);
    }
  }

  // Delete a thread and all its messages
  async deleteThread(threadId: string): Promise<void> {
    // Delete all messages first
    await this.supabase.from("chat_messages").delete().eq("threadId", threadId);

    // Delete the thread
    const { error } = await this.supabase
      .from("chat_threads")
      .delete()
      .eq("threadId", threadId);

    if (error) {
      throw new Error(`Failed to delete thread: ${error.message}`);
    }
  }

  // Get the next available thread number for a user (utility method)
  async getNextThreadNumber(userId: string): Promise<number> {
    const { data: existingThreads } = await this.supabase
      .from("chat_threads")
      .select("threadId")
      .eq("userId", userId)
      .order("createdAt", { ascending: true });

    if (!existingThreads || existingThreads.length === 0) {
      return 1;
    }

    const threadNumbers = existingThreads
      .map((thread) => {
        const parts = thread.threadId.split("-");
        const numberPart = parts[parts.length - 1];
        return parseInt(numberPart) || 0;
      })
      .filter((num) => !isNaN(num) && num > 0);

    return threadNumbers.length > 0 ? Math.max(...threadNumbers) + 1 : 1;
  }
}

// Export a singleton instance
export const chatService = new ChatService();
