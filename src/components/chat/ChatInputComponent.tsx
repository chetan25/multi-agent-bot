"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Paperclip,
  X,
  CheckCircle,
  Loader2,
  Image,
  MessageSquare,
} from "lucide-react";
import { FileUpload } from "./FileUpload";
import { FileDisplay } from "./FileDisplay";
import { ImageGenerationComponent } from "./ImageGenerationComponent";
import { FileAttachment } from "@/lib/types";
import { useConfigurationStore } from "@/lib/stores/configurationStore";

interface ChatInputComponentProps {
  input: string;
  onInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  chatReady: boolean;
  supportsVision: boolean;
  supportsImageGeneration: boolean;
  selectedFiles: FileAttachment[];
  onFilesSelected: (files: FileAttachment[]) => void;
  onRemoveFile: (fileId: string) => void;
}

export function ChatInputComponent({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  chatReady,
  supportsVision,
  supportsImageGeneration,
  selectedFiles,
  onFilesSelected,
  onRemoveFile,
}: ChatInputComponentProps) {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showImageGeneration, setShowImageGeneration] = useState(false);
  const [mode, setMode] = useState<"chat" | "image-generation">("chat");

  const { selectedProvider, selectedModel, providerConfig } =
    useConfigurationStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chatReady) {
      alert("Chat is not ready yet. Please wait a moment.");
      return;
    }
    if (!input.trim() && selectedFiles.length === 0) {
      alert("Please enter a message or attach a file.");
      return;
    }

    await onSubmit(e);

    // Clear selected files after successful submission
    if (selectedFiles.length > 0) {
      onFilesSelected([]);
      setShowFileUpload(false);
    }
  };

  const handleImageGenerated = (
    images: { base64: string; uint8Array: number[] }[]
  ) => {
    console.log("Images generated:", images);
    // You can optionally add the generated images to the chat or handle them separately
  };

  return (
    <>
      <Separator />

      {/* Mode Toggle */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "chat" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("chat")}
            disabled={isLoading || !chatReady}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
          <Button
            type="button"
            variant={mode === "image-generation" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("image-generation")}
            disabled={isLoading || !chatReady || !supportsImageGeneration}
            className="flex items-center gap-2"
          >
            <Image className="h-4 w-4" />
            Generate Images
          </Button>
        </div>

        {/* Mode Indicators */}
        <div className="flex gap-2 mt-2 text-xs">
          {supportsVision && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Vision
            </span>
          )}
          {supportsImageGeneration && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
              Image Generation
            </span>
          )}
        </div>
      </div>

      {/* Image Generation Panel */}
      {mode === "image-generation" &&
        showImageGeneration &&
        supportsImageGeneration && (
          <div className="p-4 border-b">
            <ImageGenerationComponent
              model={selectedModel}
              userApiKey={providerConfig?.apiKey || ""}
              onImageGenerated={handleImageGenerated}
            />
          </div>
        )}

      {/* File Upload Panel */}
      {mode === "chat" && showFileUpload && supportsVision && (
        <div className="p-4 border-b">
          <FileUpload
            onFilesSelected={onFilesSelected}
            maxFiles={5}
            maxFileSize={20}
            acceptedTypes={["image/*"]}
            disabled={isLoading || !chatReady}
          />
        </div>
      )}

      {/* Selected Files Preview */}
      {mode === "chat" && selectedFiles.length > 0 && (
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">
              Attachments ({selectedFiles.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilesSelected([])}
              className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-3 w-3" />
              Clear All
            </Button>
          </div>
          <div className="max-w-full overflow-x-auto">
            <FileDisplay
              attachments={selectedFiles}
              compact
              onRemoveFile={onRemoveFile}
            />
          </div>
        </div>
      )}

      {/* Chat Input Area - Fixed at bottom */}
      <form onSubmit={handleSubmit} className="p-4 flex-shrink-0">
        <div className="flex gap-2">
          {mode === "chat" && supportsVision && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFileUpload(!showFileUpload)}
              disabled={isLoading || !chatReady}
              className="px-3"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          )}

          {mode === "image-generation" && supportsImageGeneration && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowImageGeneration(!showImageGeneration)}
              disabled={isLoading || !chatReady}
              className="px-3"
            >
              <Image className="h-4 w-4" />
            </Button>
          )}

          <Input
            value={input}
            onChange={onInputChange}
            placeholder={
              chatReady
                ? mode === "chat"
                  ? supportsVision
                    ? "Type your message or attach images..."
                    : "Type your message..."
                  : "Enter a prompt to generate images..."
                : "Input will be available after configuration..."
            }
            className="flex-1"
            disabled={isLoading || !chatReady}
          />

          {mode === "chat" && (
            <Button
              type="submit"
              disabled={
                isLoading ||
                (!input.trim() && selectedFiles.length === 0) ||
                !chatReady
              }
              className={`px-4 ${
                chatReady
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {chatReady && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {mode === "chat"
              ? `Chat is ready! ${
                  supportsVision ? "You can send text and images." : ""
                }`
              : "Image generation is ready! Click the image icon to generate images."}
          </p>
        )}
      </form>
    </>
  );
}
