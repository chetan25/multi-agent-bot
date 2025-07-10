import { google } from "googleapis";
import { getUserGoogleTokens } from "./supabase-server";

// Simple interface for the agent
export interface SimpleAgentRequest {
  message: string;
  userId: string;
}

export interface SimpleAgentResponse {
  message: string;
  success: boolean;
  error?: string;
}

// Helper function to check if error is a Google API error
function isGoogleApiError(
  error: unknown
): error is { code: number; message: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

export class SimpleGoogleDriveAgent {
  async processRequest(
    request: SimpleAgentRequest
  ): Promise<SimpleAgentResponse> {
    try {
      // Validate user ID
      if (!request.userId) {
        return {
          message: "User ID is required for this operation.",
          success: false,
          error: "Missing user ID",
        };
      }

      // Extract intent from the message
      const intent = this.extractIntent(request.message);

      if (!intent) {
        return {
          message:
            "I'm not sure what you want me to do. I can help you create files and folders.",
          success: false,
        };
      }

      // Get user tokens
      const tokens = await getUserGoogleTokens(request.userId);
      if (!tokens) {
        return {
          message: "You need to authenticate with Google Drive first.",
          success: false,
          error: "User not authenticated with Google Drive",
        };
      }

      // Initialize Google OAuth2
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      // Set credentials
      oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
      });

      // Initialize Google Drive API
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // Execute the operation
      if (intent.operation === "create_file") {
        // Create file metadata
        const fileMetadata = {
          name: intent.parameters.fileName,
          mimeType: "text/plain",
        };

        // Create file content
        const media = {
          mimeType: "text/plain",
          body: intent.parameters.content || "",
        };

        // Upload file
        const result = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: "id,name,webViewLink",
        });

        return {
          message: `Successfully created file "${intent.parameters.fileName}". You can view it at: ${result.data.webViewLink}`,
          success: true,
        };
      } else if (intent.operation === "create_folder") {
        // Create folder metadata
        const folderMetadata = {
          name: intent.parameters.folderName,
          mimeType: "application/vnd.google-apps.folder",
        };

        // Create folder
        const result = await drive.files.create({
          requestBody: folderMetadata,
          fields: "id,name,webViewLink",
        });

        return {
          message: `Successfully created folder "${intent.parameters.folderName}". You can view it at: ${result.data.webViewLink}`,
          success: true,
        };
      }

      return {
        message: "Operation not supported.",
        success: false,
      };
    } catch (error) {
      console.error("Error in SimpleGoogleDriveAgent:", error);

      // Handle specific Google API errors
      if (isGoogleApiError(error)) {
        if (error.code === 401) {
          return {
            message:
              "Authentication failed. Please reconnect your Google account.",
            success: false,
            error: "Authentication failed",
          };
        } else if (error.code === 403) {
          return {
            message:
              "Permission denied. You don't have access to perform this operation.",
            success: false,
            error: "Permission denied",
          };
        } else if (error.code === 429) {
          return {
            message: "Rate limit exceeded. Please try again later.",
            success: false,
            error: "Rate limit exceeded",
          };
        }
      }

      return {
        message:
          "I encountered an error while processing your request. Please try again.",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private extractIntent(
    message: string
  ): { operation: string; parameters: any } | null {
    const lowerMessage = message.toLowerCase();

    // Check for file creation
    if (
      lowerMessage.includes("create") &&
      (lowerMessage.includes("file") || lowerMessage.includes("document"))
    ) {
      const fileName = this.extractFileName(message);
      const content = this.extractContent(message);

      return {
        operation: "create_file",
        parameters: {
          fileName: fileName || "Untitled Document",
          content: content || "",
        },
      };
    }

    // Check for folder creation
    if (lowerMessage.includes("create") && lowerMessage.includes("folder")) {
      const folderName = this.extractFolderName(message);

      return {
        operation: "create_folder",
        parameters: {
          folderName: folderName || "New Folder",
        },
      };
    }

    return null;
  }

  private extractFileName(message: string): string | null {
    // Look for patterns like "called X" or "named X"
    const calledMatch = message.match(/called\s+["']?([^"']+)["']?/i);
    if (calledMatch) return calledMatch[1];

    const namedMatch = message.match(/named\s+["']?([^"']+)["']?/i);
    if (namedMatch) return namedMatch[1];

    // Look for content after "create file" or "create document"
    const createMatch = message.match(
      /create\s+(?:file|document)\s+["']?([^"']+)["']?/i
    );
    if (createMatch) return createMatch[1];

    return null;
  }

  private extractContent(message: string): string | null {
    // Look for content after "with content" or "containing"
    const contentMatch = message.match(/with\s+content\s+["']?([^"']+)["']?/i);
    if (contentMatch) return contentMatch[1];

    const containingMatch = message.match(/containing\s+["']?([^"']+)["']?/i);
    if (containingMatch) return containingMatch[1];

    return null;
  }

  private extractFolderName(message: string): string | null {
    // Look for patterns like "called X" or "named X"
    const calledMatch = message.match(/called\s+["']?([^"']+)["']?/i);
    if (calledMatch) return calledMatch[1];

    const namedMatch = message.match(/named\s+["']?([^"']+)["']?/i);
    if (namedMatch) return namedMatch[1];

    // Look for content after "create folder"
    const createMatch = message.match(/create\s+folder\s+["']?([^"']+)["']?/i);
    if (createMatch) return createMatch[1];

    return null;
  }
}
