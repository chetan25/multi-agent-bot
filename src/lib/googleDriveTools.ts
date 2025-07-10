import { tool } from "ai";
import { z } from "zod";
import { google } from "googleapis";
import { getAuthenticatedUser, getUserGoogleTokens } from "./supabase-server";
import { Readable } from "stream";

// Helper function to get MIME type based on file extension
function getMimeType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "txt":
      return "text/plain";
    case "md":
      return "text/markdown";
    case "json":
      return "application/json";
    case "csv":
      return "text/csv";
    case "html":
      return "text/html";
    case "css":
      return "text/css";
    case "js":
      return "application/javascript";
    case "py":
      return "text/x-python";
    case "java":
      return "text/x-java-source";
    case "cpp":
    case "cc":
    case "cxx":
      return "text/x-c++src";
    case "c":
      return "text/x-csrc";
    default:
      return "text/plain";
  }
}

// Helper function to create a readable stream from content
function createContentStream(content: string): Readable {
  const stream = new Readable();
  stream.push(content);
  stream.push(null); // End the stream
  return stream;
}

// Helper function to check if error is a Google API error
function isGoogleApiError(
  error: unknown
): error is { code: number; message: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

// Create file tool
export const createFileTool = tool({
  description: "Create a new file with specified content in Google Drive",
  parameters: z.object({
    fileName: z.string().describe("Name of the file to create"),
    content: z.string().describe("Content to write to the file"),
    userId: z.string().describe("ID of the user creating the file"),
  }),
  execute: async ({ fileName, content, userId }) => {
    try {
      // Validate user authentication
      const authenticatedUser = await getAuthenticatedUser();

      // Ensure the userId matches the authenticated user
      if (userId !== authenticatedUser.id) {
        return {
          success: false,
          error:
            "User ID mismatch - you can only create files for your own account",
        };
      }

      // Get user tokens
      const tokens = await getUserGoogleTokens(userId);
      if (!tokens) {
        return {
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

      // Determine MIME type based on file extension
      const mimeType = getMimeType(fileName);

      // Create file metadata
      const fileMetadata = {
        name: fileName,
        mimeType: mimeType,
      };

      // Create content stream
      const contentStream = createContentStream(content);

      // Upload file
      const result = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: mimeType,
          body: contentStream,
        },
        fields: "id,name,webViewLink,size,createdTime",
      });

      return {
        success: true,
        message: `Successfully created file "${fileName}"`,
        fileId: result.data.id,
        fileName: result.data.name,
        webViewLink: result.data.webViewLink,
        fileSize: result.data.size,
        createdTime: result.data.createdTime,
      };
    } catch (error) {
      console.error("Error creating file:", error);

      // Handle specific Google API errors
      if (isGoogleApiError(error)) {
        if (error.code === 401) {
          return {
            success: false,
            error:
              "Authentication failed. Please reconnect your Google account.",
          };
        } else if (error.code === 403) {
          return {
            success: false,
            error: "Permission denied. You don't have access to create files.",
          };
        } else if (error.code === 429) {
          return {
            success: false,
            error: "Rate limit exceeded. Please try again later.",
          };
        }
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred while creating file",
      };
    }
  },
});

// Create folder tool
export const createFolderTool = tool({
  description: "Create a new folder in Google Drive",
  parameters: z.object({
    folderName: z.string().describe("Name of the folder to create"),
    userId: z.string().describe("ID of the user creating the folder"),
  }),
  execute: async ({ folderName, userId }) => {
    try {
      // Validate user authentication
      const authenticatedUser = await getAuthenticatedUser();

      // Ensure the userId matches the authenticated user
      if (userId !== authenticatedUser.id) {
        return {
          success: false,
          error:
            "User ID mismatch - you can only create folders for your own account",
        };
      }

      // Get user tokens
      const tokens = await getUserGoogleTokens(userId);
      if (!tokens) {
        return {
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

      // Create folder metadata
      const folderMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      };

      // Create folder
      const result = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id,name,webViewLink,createdTime",
      });

      return {
        success: true,
        message: `Successfully created folder "${folderName}"`,
        folderId: result.data.id,
        folderName: result.data.name,
        webViewLink: result.data.webViewLink,
        createdTime: result.data.createdTime,
      };
    } catch (error) {
      console.error("Error creating folder:", error);

      // Handle specific Google API errors
      if (isGoogleApiError(error)) {
        if (error.code === 401) {
          return {
            success: false,
            error:
              "Authentication failed. Please reconnect your Google account.",
          };
        } else if (error.code === 403) {
          return {
            success: false,
            error:
              "Permission denied. You don't have access to create folders.",
          };
        } else if (error.code === 429) {
          return {
            success: false,
            error: "Rate limit exceeded. Please try again later.",
          };
        }
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred while creating folder",
      };
    }
  },
});

// Export all tools
export const googleDriveTools = [createFileTool, createFolderTool];
