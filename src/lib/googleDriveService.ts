import { google } from "googleapis";
import { getAuthenticatedUser, getUserGoogleTokens } from "./supabase-server";

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

// Backend Google Drive Service
export class GoogleDriveService {
  private drive: any;
  private docs: any;
  private sheets: any;

  constructor() {}

  // Initialize the service with user authentication
  async initialize() {
    const user = await getAuthenticatedUser();
    const tokens = await getUserGoogleTokens(user.id);

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

    // Initialize Google APIs
    this.drive = google.drive({ version: "v3", auth: oauth2Client });
    this.docs = google.docs({ version: "v1", auth: oauth2Client });
    this.sheets = google.sheets({ version: "v4", auth: oauth2Client });
  }

  // List files and folders
  async listFiles(
    folderId: string = "root",
    pageSize: number = 50,
    pageToken?: string
  ): Promise<{
    files: GoogleDriveFile[];
    nextPageToken?: string;
  }> {
    await this.initialize();

    const response = await this.drive.files.list({
      pageSize,
      pageToken: pageToken || undefined,
      fields:
        "nextPageToken,files(id,name,mimeType,size,modifiedTime,parents,webViewLink,thumbnailLink)",
      q: `'${folderId}' in parents and trashed=false`,
      orderBy: "name",
    });

    const files = (response.data.files || []).map((file: any) => ({
      id: file.id || "",
      name: file.name || "",
      mimeType: file.mimeType || "",
      size: file.size || undefined,
      modifiedTime: file.modifiedTime || "",
      parents: file.parents || undefined,
      webViewLink: file.webViewLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined,
    }));

    return {
      files,
      nextPageToken: response.data.nextPageToken || undefined,
    };
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
    await this.initialize();

    const response = await this.drive.files.list({
      pageSize,
      pageToken: pageToken || undefined,
      fields:
        "nextPageToken,files(id,name,mimeType,size,modifiedTime,parents,webViewLink,thumbnailLink)",
      q: `name contains '${query}' and trashed=false`,
      orderBy: "modifiedTime desc",
    });

    const files = (response.data.files || []).map((file: any) => ({
      id: file.id || "",
      name: file.name || "",
      mimeType: file.mimeType || "",
      size: file.size || undefined,
      modifiedTime: file.modifiedTime || "",
      parents: file.parents || undefined,
      webViewLink: file.webViewLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined,
    }));

    return {
      files,
      nextPageToken: response.data.nextPageToken || undefined,
    };
  }

  // Get file details
  async getFile(fileId: string): Promise<GoogleDriveFile> {
    await this.initialize();

    const response = await this.drive.files.get({
      fileId,
      fields:
        "id,name,mimeType,size,modifiedTime,parents,webViewLink,thumbnailLink",
    });

    const file = response.data;
    return {
      id: file.id || "",
      name: file.name || "",
      mimeType: file.mimeType || "",
      size: file.size || undefined,
      modifiedTime: file.modifiedTime || "",
      parents: file.parents || undefined,
      webViewLink: file.webViewLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined,
    };
  }

  // Create folder
  async createFolder(
    name: string,
    parentId: string = "root"
  ): Promise<GoogleDriveFolder> {
    await this.initialize();

    const response = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      fields: "id,name,mimeType,modifiedTime,parents,webViewLink",
    });

    const folder = response.data;
    return {
      id: folder.id || "",
      name: folder.name || "",
      mimeType: folder.mimeType || "",
      modifiedTime: folder.modifiedTime || "",
      parents: folder.parents || undefined,
      webViewLink: folder.webViewLink || undefined,
    };
  }

  // Delete file
  async deleteFile(fileId: string): Promise<void> {
    await this.initialize();
    await this.drive.files.delete({ fileId });
  }

  // Read Google Document content
  async readDocument(documentId: string): Promise<DocumentContent> {
    await this.initialize();

    const response = await this.docs.documents.get({
      documentId,
    });

    const document = response.data;
    const content = this.extractTextFromDocument(document);

    return {
      id: documentId,
      title: document.title || "Untitled",
      content,
      lastModified: document.documentId || new Date().toISOString(),
    };
  }

  // Create new Google Document
  async createDocument(
    title: string,
    content?: string
  ): Promise<DocumentContent> {
    await this.initialize();

    const document = {
      title,
      body: {
        content: content
          ? [
              {
                paragraph: {
                  elements: [
                    {
                      textRun: {
                        content,
                      },
                    },
                  ],
                },
              },
            ]
          : [],
      },
    };

    const response = await this.docs.documents.create({
      requestBody: document,
    });

    const createdDoc = response.data;
    return {
      id: createdDoc.documentId!,
      title: createdDoc.title || title,
      content: content || "",
      lastModified: new Date().toISOString(),
    };
  }

  // Update Google Document
  async updateDocument(documentId: string, content: string): Promise<void> {
    await this.initialize();

    const requests = [
      {
        insertText: {
          location: {
            index: 1,
          },
          text: content,
        },
      },
    ];

    await this.docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests,
      },
    });
  }

  // Upload file to Google Drive
  async uploadFile(
    fileName: string,
    fileContent: string | Buffer,
    mimeType: string,
    parentId?: string
  ): Promise<GoogleDriveFile> {
    await this.initialize();

    // Convert base64 content back to buffer if needed
    let fileBuffer: Buffer;
    if (typeof fileContent === "string") {
      if (fileContent.startsWith("data:")) {
        const base64Data = fileContent.split(",")[1];
        fileBuffer = Buffer.from(base64Data, "base64");
      } else {
        fileBuffer = Buffer.from(fileContent, "base64");
      }
    } else {
      fileBuffer = Buffer.from(fileContent);
    }

    const fileMetadata = {
      name: fileName,
      parents: parentId ? [parentId] : undefined,
    };

    const media = {
      mimeType,
      body: fileBuffer,
    };

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id,name,mimeType,size,modifiedTime,parents,webViewLink",
    });

    const file = response.data;
    return {
      id: file.id || "",
      name: file.name || "",
      mimeType: file.mimeType || "",
      size: file.size || undefined,
      modifiedTime: file.modifiedTime || "",
      parents: file.parents || undefined,
      webViewLink: file.webViewLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined,
    };
  }

  // Share file with specific permissions
  async shareFile(
    fileId: string,
    email: string,
    role: "reader" | "writer" | "commenter" = "reader"
  ): Promise<void> {
    await this.initialize();

    const permission = {
      type: "user",
      role,
      emailAddress: email,
    };

    await this.drive.permissions.create({
      fileId,
      requestBody: permission,
    });
  }

  // Helper function to extract text from Google Document
  private extractTextFromDocument(document: any): string {
    if (!document.body || !document.body.content) {
      return "";
    }

    let text = "";
    document.body.content.forEach((element: any) => {
      if (element.paragraph && element.paragraph.elements) {
        element.paragraph.elements.forEach((textElement: any) => {
          if (textElement.textRun && textElement.textRun.content) {
            text += textElement.textRun.content;
          }
        });
      }
    });

    return text;
  }
}
