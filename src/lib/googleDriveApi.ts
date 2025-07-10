// Frontend service for Google Drive operations
// This file only contains fetch calls to Next.js API routes
// NO Google API calls are made from the frontend

// Interface for Google Drive file
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  parents?: string[];
  webViewLink?: string;
  thumbnailLink?: string;
}

// Interface for Google Drive folder
export interface GoogleDriveFolder {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  parents?: string[];
  webViewLink?: string;
}

// Interface for document content
export interface DocumentContent {
  id: string;
  title: string;
  content: string;
  lastModified: string;
}

// Frontend service for Google Drive operations
export class GoogleDriveApiService {
  // List files and folders
  async listFiles(
    folderId: string = "root",
    pageSize: number = 50,
    pageToken?: string
  ): Promise<{
    files: GoogleDriveFile[];
    nextPageToken?: string;
  }> {
    try {
      const params = new URLSearchParams({
        folderId,
        pageSize: pageSize.toString(),
      });

      if (pageToken) {
        params.append("pageToken", pageToken);
      }

      const response = await fetch(`/api/drive/list?${params}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error listing files:", error);
      throw new Error(
        `Failed to list files: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Search files
  async searchFiles(
    query: string,
    pageSize: number = 50,
    pageToken?: string
  ): Promise<{
    files: GoogleDriveFile[];
    nextPageToken?: string;
  }> {
    try {
      const params = new URLSearchParams({
        query,
        pageSize: pageSize.toString(),
      });

      if (pageToken) {
        params.append("pageToken", pageToken);
      }

      const response = await fetch(`/api/drive/search?${params}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching files:", error);
      throw new Error(
        `Failed to search files: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Get file details
  async getFile(fileId: string): Promise<GoogleDriveFile> {
    try {
      const response = await fetch(`/api/drive/file/${fileId}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting file:", error);
      throw new Error(
        `Failed to get file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Create folder
  async createFolder(
    name: string,
    parentId: string = "root"
  ): Promise<GoogleDriveFolder> {
    try {
      const response = await fetch("/api/drive/folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, parentId }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating folder:", error);
      throw new Error(
        `Failed to create folder: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Delete file
  async deleteFile(fileId: string): Promise<void> {
    try {
      const response = await fetch(`/api/drive/file/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      throw new Error(
        `Failed to delete file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Read Google Document content
  async readDocument(documentId: string): Promise<DocumentContent> {
    try {
      const response = await fetch(`/api/drive/document/${documentId}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error reading document:", error);
      throw new Error(
        `Failed to read document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Create new Google Document
  async createDocument(
    title: string,
    content?: string
  ): Promise<DocumentContent> {
    try {
      const response = await fetch("/api/drive/document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating document:", error);
      throw new Error(
        `Failed to create document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Update Google Document
  async updateDocument(documentId: string, content: string): Promise<void> {
    try {
      const response = await fetch(`/api/drive/document/${documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating document:", error);
      throw new Error(
        `Failed to update document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Upload file to Google Drive
  async uploadFile(
    fileName: string,
    fileContent: string | Buffer,
    mimeType: string,
    parentId?: string
  ): Promise<GoogleDriveFile> {
    try {
      const response = await fetch("/api/drive/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName,
          fileContent:
            typeof fileContent === "string"
              ? fileContent
              : fileContent.toString("base64"),
          mimeType,
          parentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(
        `Failed to upload file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Share file with specific permissions
  async shareFile(
    fileId: string,
    email: string,
    role: "reader" | "writer" | "commenter" = "reader"
  ): Promise<void> {
    try {
      const response = await fetch(`/api/drive/share/${fileId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error sharing file:", error);
      throw new Error(
        `Failed to share file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

// Create a singleton instance
export const googleDriveApi = new GoogleDriveApiService();
