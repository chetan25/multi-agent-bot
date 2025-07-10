import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/googleDriveService";

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Document title is required" },
        { status: 400 }
      );
    }

    const driveService = new GoogleDriveService();
    const document = await driveService.createDocument(title, content);

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error creating document:", error);

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
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
