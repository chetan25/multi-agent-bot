import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract data from Vapi workflow
    const { transcript, sessionId, userId, llmResponse, assistantId } = body;

    if (!transcript) {
      return NextResponse.json(
        {
          error: "No transcript provided",
          message: "I didn't catch that. Could you please repeat your request?",
        },
        { status: 400 }
      );
    }

    console.log("Voice command received:", {
      transcript,
      sessionId,
      userId,
      llmResponse,
      assistantId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Process the transcript through our agent system
    // This will be implemented in the next step when we integrate with the agent

    // For now, return a response that Vapi can convert to speech
    const response = {
      message: `I received your request: "${transcript}". I'm processing your Google Drive command. Please wait while I handle this for you.`,
      sessionId,
      timestamp: new Date().toISOString(),
      status: "processing",
    };

    // Vapi expects the response in this format for TTS
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing voice command:", error);

    // Return a user-friendly error message for TTS
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          "I encountered an error processing your request. Please try again.",
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
