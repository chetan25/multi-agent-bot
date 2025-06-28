"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Loader2,
  Calendar,
  Hash,
} from "lucide-react";
import { useChatThreadStore } from "@/lib/stores/chatThreadStore";
import { useAuth } from "@/hooks/useAuth";
import { ChatThread } from "@/lib/types";

interface ThreadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onThreadSelect: (thread: ChatThread) => void;
  onCreateNewThread: () => void;
}

export function ThreadDrawer({
  isOpen,
  onClose,
  onThreadSelect,
  onCreateNewThread,
}: ThreadDrawerProps) {
  const { user } = useAuth();
  const {
    threads,
    currentThread,
    loading,
    error,
    loadUserThreads,
    updateThreadTitle,
    deleteThread,
  } = useChatThreadStore();

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Load threads when drawer opens and user is available
  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserThreads(user.id);
    }
  }, [isOpen, user?.id, loadUserThreads]);

  const handleThreadClick = (thread: ChatThread) => {
    onThreadSelect(thread);
    onClose();
  };

  const handleCreateNew = () => {
    onCreateNewThread();
    onClose();
  };

  const startEditing = (thread: ChatThread) => {
    setEditingThreadId(thread.threadId);
    setEditTitle(thread.title);
  };

  const cancelEditing = () => {
    setEditingThreadId(null);
    setEditTitle("");
  };

  const saveTitle = async () => {
    if (!editingThreadId || !editTitle.trim()) return;

    setIsUpdating(true);
    try {
      await updateThreadTitle(editingThreadId, editTitle.trim());
      setEditingThreadId(null);
      setEditTitle("");
    } catch (error) {
      console.error("Failed to update title:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this conversation? This action cannot be undone."
      )
    ) {
      try {
        await deleteThread(threadId);
      } catch (error) {
        console.error("Failed to delete thread:", error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-80 max-w-[80vw] h-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b">
          <Button
            onClick={handleCreateNew}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => user?.id && loadUserThreads(user.id)}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {threads.map((thread) => (
                <div
                  key={thread.threadId}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                    currentThread?.threadId === thread.threadId
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleThreadClick(thread)}
                >
                  {editingThreadId === thread.threadId ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveTitle();
                          if (e.key === "Escape") cancelEditing();
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={saveTitle}
                        disabled={isUpdating}
                        className="h-8 w-8 p-0"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {thread.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Hash className="h-3 w-3" />
                            <span>{thread.messageCount} messages</span>
                            <Calendar className="h-3 w-3 ml-2" />
                            <span>{formatDate(thread.updatedAt)}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(thread);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) =>
                              handleDeleteThread(thread.threadId, e)
                            }
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
