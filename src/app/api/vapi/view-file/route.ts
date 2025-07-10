import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract data from Vapi webhook
    const { fileName, sessionId, userId } = body;

    // Validate required fields
    if (!fileName) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Please provide a file name to view.",
        },
        { status: 400 }
      );
    }

    // Validate authorization - both userId and sessionId are required
    if (!userId || !sessionId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "User authentication required.",
        },
        { status: 401 }
      );
    }

    // TODO: Validate user exists and session is valid
    // This will be implemented when we add session management

    console.log("Vapi view file request:", {
      fileName,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement Google Drive file reading
    // This will be implemented in the next step when we integrate with Google Drive API

    // For now, return a mock response
    const response = {
      message: `I found the file "${fileName}". Here's the content: [File content will be displayed here when Google Drive integration is complete.]`,
      fileName,
      content:
        "Sample file content - this will be replaced with actual file content from Google Drive",
      status: "viewed",
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error viewing file via Vapi:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "I encountered an error reading your file. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
