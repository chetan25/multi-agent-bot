import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getUserGoogleTokens,
} from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract data from Vapi webhook
    const { message, sessionId } = body;

    console.log("Vapi agent request:", {
      message,
      sessionId,
      timestamp: new Date().toISOString(),
    });

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Please provide a message.",
        },
        { status: 400 }
      );
    }

    // Get authenticated user from session
    let user;
    try {
      user = await getAuthenticatedUser();
      console.log("Authenticated user:", user.id);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Authentication required",
          message: "Please sign in to use this feature.",
        },
        { status: 401 }
      );
    }

    // Verify user has Google Drive connected
    try {
      const tokens = await getUserGoogleTokens(user.id);
      console.log("Google Drive tokens found for user:", user.id);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Google Drive not connected",
          message: "Please connect your Google Drive account first.",
        },
        { status: 403 }
      );
    }

    // Call the AI route for processing
    const aiResponse = await fetch(`${request.nextUrl.origin}/api/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message.trim(),
        userId: user.id, // Pass the authenticated user's ID
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("AI processing failed");
    }

    const aiResult = await aiResponse.json();

    console.log("AI processing result:", {
      success: aiResult.success,
      messageLength: aiResult.message.length,
      hasError: !!aiResult.error,
    });

    // Format response for Vapi
    const response = {
      message: aiResult.message,
      success: aiResult.success,
      error: aiResult.error,
      sessionId,
      userId: user.id,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing Vapi agent request:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          "I encountered an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
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
