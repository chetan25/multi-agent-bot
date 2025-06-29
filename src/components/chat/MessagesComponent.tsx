"use client";

import { Bot, User, Loader2, Image } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import { FileDisplay } from "./FileDisplay";

interface MessagesComponentProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: Error | null;
  supportsVision?: boolean;
  chatReady?: boolean;
}

export function MessagesComponent({
  messages,
  isLoading,
  error,
  supportsVision = false,
  chatReady = false,
}: MessagesComponentProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
          <p className="text-gray-600 text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
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

      {messages.length === 0 ? (
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
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex gap-3 max-w-[80%] ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
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
                {/* Message Content */}
                {message.content && (
                  <p className="whitespace-pre-wrap mb-2">{message.content}</p>
                )}

                {/* Image Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1 mb-2 text-xs opacity-75">
                      <Image className="h-3 w-3" />
                      <span>Attachments ({message.attachments.length})</span>
                    </div>
                    <div className="max-w-full overflow-x-auto">
                      <FileDisplay
                        attachments={message.attachments}
                        compact={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
