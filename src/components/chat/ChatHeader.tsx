"use client";

import { Button } from "@/components/ui/button";
import { Menu, Plus, MessageSquare } from "lucide-react";

interface ChatHeaderProps {
  title?: string;
  onMenuClick: () => void;
  onNewChat: () => void;
  currentThreadTitle?: string;
}

export function ChatHeader({
  title = "AI Chat Assistant",
  onMenuClick,
  onNewChat,
  currentThreadTitle,
}: ChatHeaderProps) {
  return (
    <div className="sticky top-[88px] z-20 flex items-center justify-between p-4 border-b bg-white/95 backdrop-blur-sm shadow-sm">
      {/* Left side - Menu button and title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="h-8 w-8 p-0"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentThreadTitle || title}
            </h1>
            {currentThreadTitle && (
              <p className="text-xs text-gray-500">AI Chat Assistant</p>
            )}
          </div>
        </div>
      </div>

      {/* Right side - New chat button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onNewChat}
        className="h-8 px-3"
      >
        <Plus className="h-4 w-4 mr-1" />
        New Chat
      </Button>
    </div>
  );
}
