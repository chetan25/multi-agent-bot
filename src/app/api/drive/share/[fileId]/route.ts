import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/googleDriveService";

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { email, role = "reader" } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    const driveService = new GoogleDriveService();
    await driveService.shareFile(params.fileId, email, role);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sharing file:", error);

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
      { error: "Failed to share file" },
      { status: 500 }
    );
  }
}
