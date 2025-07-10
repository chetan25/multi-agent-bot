import { NextRequest, NextResponse } from "next/server";
import { validateVapiSession, checkRateLimit } from "@/lib/vapiSessionManager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract data from Vapi webhook
    const { fileName, content, fileLocation, sessionId, userId } = body;

    console.log("Vapi create file request:", body);
    // Validate required fields
    if (!fileName || !content) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Please provide both file name and content.",
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

    // Validate session and user
    const sessionValidation = await validateVapiSession(sessionId, userId);
    if (!sessionValidation.isValid) {
      return NextResponse.json(
        {
          error: "Invalid session",
          message: "Your session has expired. Please start a new voice call.",
        },
        { status: 401 }
      );
    }

    // Check rate limiting
    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            "You've made too many requests. Please wait before trying again.",
        },
        { status: 429 }
      );
    }

    console.log("Vapi create file request:", {
      fileName,
      fileLocation,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement Google Drive file creation
    // This will be implemented in the next step when we integrate with Google Drive API

    // For now, return a success response
    const response = {
      message: `I've created the file "${fileName}" with your content. The file has been saved to your Google Drive.`,
      fileName,
      fileLocation: fileLocation || "root",
      status: "created",
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating file via Vapi:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "I encountered an error creating your file. Please try again.",
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
