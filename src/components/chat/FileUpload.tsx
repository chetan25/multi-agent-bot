"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileAttachment } from "@/lib/types";
import { Upload, X, Image, File, FileText, Loader2 } from "lucide-react";
import { imageUploadService } from "@/lib/imageUploadService";
import { useSessionManager } from "@/lib/sessionManager";

interface FileUploadProps {
  onFilesSelected: (files: FileAttachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 5,
  maxFileSize = 20, // 20MB default
  acceptedTypes = ["image/*"],
  disabled = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useSessionManager();

  const processFiles = async (files: FileList): Promise<FileAttachment[]> => {
    if (!user?.id) {
      throw new Error("User must be authenticated to upload files");
    }

    const processedFiles: FileAttachment[] = [];

    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(
          `File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`
        );
        continue;
      }

      // Check file type
      const isAccepted = acceptedTypes.some((type) => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isAccepted) {
        alert(`File type ${file.type} is not supported.`);
        continue;
      }

      // Validate image file
      const validation = imageUploadService.validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        continue;
      }

      try {
        // Upload to Supabase and get FileAttachment
        const uploadedAttachment = await imageUploadService.uploadImage(
          file,
          user.id
        );

        // Use the uploaded attachment directly
        processedFiles.push(uploadedAttachment);
      } catch (error) {
        console.error("Error processing file:", error);
        alert(
          `Error processing file ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return processedFiles;
  };

  const handleFileSelect = async (files: FileList) => {
    if (!user?.id) {
      alert("Please sign in to upload files");
      return;
    }

    setIsUploading(true);
    try {
      const processedFiles = await processFiles(files);
      const newFiles = [...selectedFiles, ...processedFiles].slice(0, maxFiles);
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    } catch (error) {
      console.error("Error handling file selection:", error);
      alert("Failed to process files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (fileId: string) => {
    const newFiles = selectedFiles.filter((f) => f.id !== fileId);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    } else if (mimeType.startsWith("text/")) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!user?.id) {
    return (
      <div className="border-2 border-dashed rounded-lg p-6 text-center border-gray-300 bg-gray-50">
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-1">
          Please sign in to upload files
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${
          disabled || isUploading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() =>
          !disabled && !isUploading && fileInputRef.current?.click()
        }
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-600 mb-1">Uploading files...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-1">
              Drag and drop images here, or click to select
            </p>
            <p className="text-xs text-gray-500">
              Max {maxFiles} files, {maxFileSize}MB each
            </p>
            <p className="text-xs text-gray-500">Supported: Images only</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-3">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h4>
            <div className="space-y-2">
              {selectedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.mimeType)}
                    <div className="text-sm">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      {file.url && (
                        <p className="text-xs text-blue-600">
                          ✓ Uploaded to cloud
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
