import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/googleDriveService";

// GET - Get file details
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const driveService = new GoogleDriveService();
    const file = await driveService.getFile(params.fileId);

    return NextResponse.json(file);
  } catch (error) {
    console.error("Error getting file:", error);

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

    return NextResponse.json({ error: "Failed to get file" }, { status: 500 });
  }
}

// DELETE - Delete file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const driveService = new GoogleDriveService();
    await driveService.deleteFile(params.fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);

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
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
