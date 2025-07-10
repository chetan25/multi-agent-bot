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
    const { folderName, folderPath, sessionId, userId } = body;

    // Validate required fields
    if (!folderName) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Please provide a folder name.",
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

    console.log("Vapi create folder request:", {
      folderName,
      folderPath,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement Google Drive folder creation
    // This will be implemented in the next step when we integrate with Google Drive API

    // For now, return a success response
    const response = {
      message: `I've created the folder "${folderName}" in your Google Drive.`,
      folderName,
      folderPath: folderPath || "root",
      status: "created",
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating folder via Vapi:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          "I encountered an error creating your folder. Please try again.",
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
