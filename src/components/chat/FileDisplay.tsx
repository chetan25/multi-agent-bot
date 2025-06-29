"use client";

import { FileAttachment } from "@/lib/types";
import { Image, File, FileText, Download, Eye, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSignedUrls } from "@/hooks/useSignedUrls";

interface FileDisplayProps {
  attachments: FileAttachment[];
  compact?: boolean;
  onRemoveFile?: (fileId: string) => void;
}

export function FileDisplay({
  attachments,
  compact = false,
  onRemoveFile,
}: FileDisplayProps) {
  const { getImageSrc, isImageLoading } = useSignedUrls(attachments);

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

  const downloadFile = (attachment: FileAttachment) => {
    const link = document.createElement("a");

    if (attachment.url) {
      // Download from URL
      link.href = attachment.url;
    } else if (attachment.data) {
      // Download from base64 data
      link.href = `data:${attachment.mimeType};base64,${attachment.data}`;
    } else {
      console.error("No data available for download:", attachment);
      return;
    }

    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewFile = (attachment: FileAttachment) => {
    if (attachment.mimeType.startsWith("image/")) {
      // For images, open in a new tab
      const imageSrc = getImageSrc(attachment);
      if (imageSrc) {
        window.open(imageSrc, "_blank");
      } else {
        console.error("No image source available:", attachment);
      }
    } else {
      // For other files, download them
      downloadFile(attachment);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => {
          const imageSrc = getImageSrc(attachment);
          const isImage = attachment.mimeType.startsWith("image/");

          return (
            <div
              key={attachment.id}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md text-xs min-w-0 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
            >
              {isImage ? (
                // Image preview with crop
                <div className="flex-shrink-0">
                  {isImageLoading(attachment) ? (
                    <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={imageSrc}
                      alt={attachment.name}
                      className="w-8 h-8 object-cover rounded border"
                      onError={(e) => {
                        console.error(
                          "Failed to load image preview:",
                          attachment
                        );
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.mimeType)}
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span
                  className="truncate max-w-32 font-medium text-gray-900"
                  title={attachment.name}
                >
                  {attachment.name}
                </span>
                <span className="text-xs text-gray-600">
                  {formatFileSize(attachment.size)}
                </span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => viewFile(attachment)}
                  className="h-4 w-4 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                {onRemoveFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(attachment.id)}
                    className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        const imageSrc = getImageSrc(attachment);

        return (
          <Card key={attachment.id} className="max-w-sm">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                {/* Image Preview */}
                {attachment.mimeType.startsWith("image/") && (
                  <div className="flex-shrink-0">
                    {isImageLoading(attachment) ? (
                      <div className="w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <img
                        src={getImageSrc(attachment)}
                        alt={attachment.name}
                        className="w-12 h-12 object-cover rounded-md border"
                        onError={(e) => {
                          console.error("Failed to load image:", attachment);
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getFileIcon(attachment.mimeType)}
                    <span
                      className="font-medium text-sm truncate text-gray-900"
                      title={attachment.name}
                    >
                      {attachment.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {formatFileSize(attachment.size)}
                  </p>
                  {attachment.url && (
                    <p className="text-xs text-blue-600 mb-2">
                      ✓ Stored in cloud
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewFile(attachment)}
                      className="h-6 px-2 text-xs"
                    >
                      {attachment.mimeType.startsWith("image/") ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
