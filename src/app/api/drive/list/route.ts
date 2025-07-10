import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/googleDriveService";

export async function GET(request: NextRequest) {
  try {
    const driveService = new GoogleDriveService();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || "root";
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const pageToken = searchParams.get("pageToken");

    // List files using the backend service
    const result = await driveService.listFiles(
      folderId,
      pageSize,
      pageToken || undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing files:", error);

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
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
