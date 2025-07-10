import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/googleDriveService";

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileContent, mimeType, parentId } = await request.json();

    if (!fileName || !fileContent || !mimeType) {
      return NextResponse.json(
        { error: "File name, content, and MIME type are required" },
        { status: 400 }
      );
    }

    const driveService = new GoogleDriveService();
    const file = await driveService.uploadFile(
      fileName,
      fileContent,
      mimeType,
      parentId
    );

    return NextResponse.json(file);
  } catch (error) {
    console.error("Error uploading file:", error);

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Google Drive not connected") {
        return NextResponse.json(
          { error: "Google Drive not connected" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
