import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/googleDriveService";

export async function POST(request: NextRequest) {
  try {
    const { name, parentId = "root" } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const driveService = new GoogleDriveService();
    const folder = await driveService.createFolder(name, parentId);

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error creating folder:", error);

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
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
