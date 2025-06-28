"use client";

import { FileAttachment } from "@/lib/types";
import { Image, File, FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FileDisplayProps {
  attachments: FileAttachment[];
  compact?: boolean;
}

export function FileDisplay({
  attachments,
  compact = false,
}: FileDisplayProps) {
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
    link.href = `data:${attachment.mimeType};base64,${attachment.data}`;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewFile = (attachment: FileAttachment) => {
    if (attachment.mimeType.startsWith("image/")) {
      // For images, open in a new tab
      const url = `data:${attachment.mimeType};base64,${attachment.data}`;
      window.open(url, "_blank");
    } else {
      // For other files, download them
      downloadFile(attachment);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs"
          >
            {getFileIcon(attachment.mimeType)}
            <span className="truncate max-w-20">{attachment.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewFile(attachment)}
              className="h-4 w-4 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <Card key={attachment.id} className="max-w-sm">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              {/* Image Preview */}
              {attachment.mimeType.startsWith("image/") && (
                <div className="flex-shrink-0">
                  <img
                    src={`data:${attachment.mimeType};base64,${attachment.data}`}
                    alt={attachment.name}
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getFileIcon(attachment.mimeType)}
                  <span className="font-medium text-sm truncate">
                    {attachment.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {formatFileSize(attachment.size)}
                </p>

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
      ))}
    </div>
  );
}
