import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/googleDriveService";

// GET - Read document content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const driveService = new GoogleDriveService();
    const document = await driveService.readDocument(documentId);

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error reading document:", error);

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
      { error: "Failed to read document" },
      { status: 500 }
    );
  }
}

// PUT - Update document content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Document content is required" },
        { status: 400 }
      );
    }

    const driveService = new GoogleDriveService();
    await driveService.updateDocument(documentId, content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating document:", error);

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
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}
