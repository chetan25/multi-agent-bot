import { tool } from "ai";
import { z } from "zod";
import { google } from "googleapis";
import { getUserGoogleTokensService } from "./supabase-server";
import { createServiceSupabaseClient } from "./supabase-server";
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

// Helper function to refresh access token
async function refreshAccessToken(
  refreshToken: string,
  userId: string
): Promise<string> {
  console.log("🔄 Refreshing access token for user:", userId);

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Token refresh failed:", response.status, errorText);
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();
    const { access_token, expires_in } = tokenData;

    if (!access_token) {
      throw new Error("No access token received from refresh");
    }

    console.log("✅ Access token refreshed successfully");

    // Update tokens in database
    const supabase = createServiceSupabaseClient();
    const tokenExpiry = new Date(Date.now() + expires_in * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("google_tokens")
      .update({
        access_token,
        token_expiry: tokenExpiry,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("❌ Failed to update tokens in database:", updateError);
    } else {
      console.log("✅ Tokens updated in database");
    }

    return access_token;
  } catch (error) {
    console.error("💥 Error refreshing access token:", error);
    throw error;
  }
}

// Helper function to get valid access token (refresh if needed)
async function getValidAccessToken(userId: string): Promise<string> {
  console.log("🔍 Getting valid access token for user:", userId);

  const tokens = await getUserGoogleTokensService(userId);

  // Check if token is expired or will expire soon (within 5 minutes)
  const now = new Date();
  const expiry = tokens.token_expiry ? new Date(tokens.token_expiry) : null;
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (!expiry || expiry <= fiveMinutesFromNow) {
    console.log("🔄 Access token expired or expiring soon, refreshing...");
    return await refreshAccessToken(tokens.refresh_token, userId);
  }

  console.log("✅ Access token is still valid");
  return tokens.access_token || "";
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
    console.log("🔧 createFileTool called with:", {
      fileName,
      contentLength: content.length,
      userId,
    });

    try {
      console.log("🔍 Getting valid access token for user:", userId);
      // Get valid access token (refresh if needed)
      const accessToken = await getValidAccessToken(userId);

      // Initialize Google OAuth2
      console.log("🔧 Initializing Google OAuth2 client");
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      // Set credentials
      oauth2Client.setCredentials({
        access_token: accessToken,
      });

      // Initialize Google Drive API
      console.log("🔧 Initializing Google Drive API");
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // Determine MIME type based on file extension
      const mimeType = getMimeType(fileName);
      console.log("📄 File details:", {
        fileName,
        mimeType,
        contentLength: content.length,
      });

      // Create file metadata
      const fileMetadata = {
        name: fileName,
        mimeType: mimeType,
      };

      // Create content stream
      const contentStream = createContentStream(content);

      console.log("🚀 Creating file in Google Drive...");
      // Upload file
      const result = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: mimeType,
          body: contentStream,
        },
        fields: "id,name,webViewLink,size,createdTime",
      });

      console.log("✅ File created successfully:", {
        fileId: result.data.id,
        fileName: result.data.name,
        webViewLink: result.data.webViewLink,
        fileSize: result.data.size,
        createdTime: result.data.createdTime,
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
      console.error("💥 Error creating file:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Handle specific Google API errors
      if (isGoogleApiError(error)) {
        console.log("🔍 Google API error detected:", {
          code: error.code,
          message: error.message,
        });
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
    console.log("🔧 createFolderTool called with:", { folderName, userId });

    try {
      console.log("🔍 Getting valid access token for user:", userId);
      // Get valid access token (refresh if needed)
      const accessToken = await getValidAccessToken(userId);

      // Initialize Google OAuth2
      console.log("🔧 Initializing Google OAuth2 client");
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      // Set credentials
      oauth2Client.setCredentials({
        access_token: accessToken,
      });

      // Initialize Google Drive API
      console.log("🔧 Initializing Google Drive API");
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      console.log("📁 Creating folder:", folderName);

      // Create folder metadata
      const folderMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      };

      console.log("🚀 Creating folder in Google Drive...");
      // Create folder
      const result = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id,name,webViewLink,createdTime",
      });

      console.log("✅ Folder created successfully:", {
        folderId: result.data.id,
        folderName: result.data.name,
        webViewLink: result.data.webViewLink,
        createdTime: result.data.createdTime,
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
      console.error("💥 Error creating folder:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Handle specific Google API errors
      if (isGoogleApiError(error)) {
        console.log("🔍 Google API error detected:", {
          code: error.code,
          message: error.message,
        });
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
