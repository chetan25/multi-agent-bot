import { useState, useEffect } from "react";
import { imageUploadService } from "@/lib/imageUploadService";
import { FileAttachment } from "@/lib/types";

// Type guard to validate FileAttachment objects
function isValidFileAttachment(att: any): att is FileAttachment {
  return (
    att &&
    typeof att === "object" &&
    typeof att.id === "string" &&
    typeof att.name === "string" &&
    typeof att.type === "string" &&
    typeof att.size === "number" &&
    typeof att.data === "string" &&
    typeof att.mimeType === "string" &&
    (att.url === undefined || typeof att.url === "string") &&
    (att.filePath === undefined || typeof att.filePath === "string")
  );
}

export function useSignedUrls(attachments: FileAttachment[]) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const generateSignedUrls = async () => {
      // Add logging to debug the issue
      console.log("useSignedUrls received attachments:", attachments);

      // Filter out invalid attachments first
      const validAttachments = attachments.filter(isValidFileAttachment);

      if (validAttachments.length !== attachments.length) {
        console.warn("Some attachments were invalid:", {
          total: attachments.length,
          valid: validAttachments.length,
          invalid: attachments.filter((att) => !isValidFileAttachment(att)),
        });
      }

      const imageAttachments = validAttachments.filter((att) => {
        // Add detailed logging for each attachment
        console.log("Processing attachment:", {
          id: att.id,
          name: att.name,
          url: att.url,
          urlType: typeof att.url,
          filePath: att.filePath,
          mimeType: att.mimeType,
        });

        try {
          return (
            att.mimeType.startsWith("image/") &&
            // Check if we have either a filePath (for storage files) or a data URL
            ((att.filePath && typeof att.filePath === "string") ||
              (att.url &&
                typeof att.url === "string" &&
                att.url.startsWith("data:")))
          );
        } catch (error) {
          console.error("Error processing attachment:", {
            attachment: att,
            error: error,
          });
          return false;
        }
      });

      for (const attachment of imageAttachments) {
        if (!signedUrls[attachment.id] && !loading[attachment.id]) {
          setLoading((prev) => ({ ...prev, [attachment.id]: true }));

          try {
            // Use filePath for storage files, not the signed URL
            const filePath = attachment.filePath;
            if (!filePath) {
              console.warn("No filePath found for attachment:", attachment.id);
              continue;
            }

            const signedUrl = await imageUploadService.getSignedUrl(filePath);
            setSignedUrls((prev) => ({ ...prev, [attachment.id]: signedUrl }));
          } catch (error) {
            console.error(
              "Failed to generate signed URL for:",
              attachment.id,
              error
            );
          } finally {
            setLoading((prev) => ({ ...prev, [attachment.id]: false }));
          }
        }
      }
    };

    generateSignedUrls();
  }, [attachments, signedUrls, loading]);

  const getImageSrc = (attachment: FileAttachment): string | undefined => {
    // Validate attachment first
    if (!isValidFileAttachment(attachment)) {
      console.error("Invalid attachment passed to getImageSrc:", attachment);
      return undefined;
    }

    // If it's a base64 data URL, use it directly
    if (
      attachment.url &&
      typeof attachment.url === "string" &&
      attachment.url.startsWith("data:")
    ) {
      return attachment.url;
    }

    // If it's a storage file and we have a signed URL, use it
    if (attachment.filePath && signedUrls[attachment.id]) {
      return signedUrls[attachment.id];
    }

    // If it's a storage file but no signed URL yet, return undefined (will show loading)
    if (attachment.filePath && !signedUrls[attachment.id]) {
      return undefined;
    }

    // If we have a signed URL in the url field (legacy), use it
    if (
      attachment.url &&
      typeof attachment.url === "string" &&
      !attachment.url.startsWith("data:") &&
      attachment.url.includes("supabase.co")
    ) {
      return attachment.url;
    }

    // Fallback to base64 data
    if (attachment.data) {
      return `data:${attachment.mimeType};base64,${attachment.data}`;
    }

    return undefined;
  };

  const isImageLoading = (attachment: FileAttachment): boolean => {
    // Validate attachment first
    if (!isValidFileAttachment(attachment)) {
      console.error("Invalid attachment passed to isImageLoading:", attachment);
      return false;
    }

    return Boolean(
      attachment.mimeType.startsWith("image/") &&
        attachment.filePath && // Check for filePath for storage files
        !signedUrls[attachment.id] && // No signed URL yet
        loading[attachment.id] // Currently loading
    );
  };

  return {
    getImageSrc,
    isImageLoading,
    signedUrls,
    loading,
  };
}
