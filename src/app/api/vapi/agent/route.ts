import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserGoogleTokensService } from "@/lib/supabase-server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createFileTool, createFolderTool } from "@/lib/googleDriveTools";

export async function POST(request: NextRequest) {
  try {
    console.log("=== VAPI AGENT REQUEST START ===");
    const body = await request.json();

    // Extract data from Vapi webhook
    const { message, userId } = body;

    console.log("Vapi agent request:", {
      message,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Validate required fields
    if (!message) {
      console.log("❌ Missing message in request");
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Please provide a message.",
        },
        { status: 400 }
      );
    }

    if (!userId) {
      console.log("❌ Missing userId in request");
      return NextResponse.json(
        {
          error: "Missing user ID",
          message: "Please provide a user ID.",
        },
        { status: 400 }
      );
    }

    console.log("✅ Request validation passed");

    // Validate if user exists in database
    console.log("🔍 Validating user in database:", userId);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !user.user) {
      console.log("❌ User validation failed:", {
        userError,
        hasUser: !!user?.user,
      });
      return NextResponse.json(
        {
          error: "User not found",
          message: "The provided user ID does not exist in our database.",
        },
        { status: 404 }
      );
    }

    console.log("✅ User validated:", user.user.id);

    // Verify user has Google Drive connected
    console.log("🔍 Checking Google Drive tokens for user:", userId);
    try {
      const tokens = await getUserGoogleTokensService(userId);
      console.log("✅ Google Drive tokens found for user:", userId, {
        hasRefreshToken: !!tokens.refresh_token,
        hasAccessToken: !!tokens.access_token,
        tokenExpiry: tokens.token_expiry,
      });
    } catch (error) {
      console.log("❌ Google Drive tokens not found:", error);
      return NextResponse.json(
        {
          error: "Google Drive not connected",
          message: "Please connect your Google Drive account first.",
        },
        { status: 403 }
      );
    }

    console.log("🚀 Starting ChatOpenAI processing...");
    console.log("📝 Message to process:", message.trim());
    console.log("👤 User ID for tools:", userId);

    // Process the request using ChatOpenAI with Google Drive tools
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      tools: {
        createFile: createFileTool,
        createFolder: createFolderTool,
      },
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that helps users create Google Drive files and folders.

Available operations:
- Create files: Create new documents with content
- Create folders: Organize files into folders

IMPORTANT: When using tools, you MUST include the userId parameter with value "${userId}".

When a user asks to create something, use the appropriate tool to perform the action. Remember to include userId: "${userId}" in your tool calls.`,
        },
        {
          role: "user",
          content: message.trim(),
        },
      ],
    });

    console.log("📊 ChatOpenAI processing result:", {
      success: true,
      messageLength: result.text.length,
      hasError: false,
      text: result.text,
      finishReason: result.finishReason,
      usage: result.usage,
    });

    // Log tool calls if any
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log("🔧 Tool calls made:", result.toolCalls.length);
      result.toolCalls.forEach((toolCall, index) => {
        console.log(`Tool call ${index + 1}:`, {
          toolName: toolCall.toolName,
          args: toolCall.args,
        });
      });
    } else {
      console.log("⚠️ No tool calls were made");
    }

    // Format response for Vapi
    const response = {
      message: result.text,
      success: true,
      error: null,
      userId: userId,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 Sending response to Vapi:", {
      messageLength: response.message.length,
      success: response.success,
      userId: response.userId,
    });

    console.log("=== VAPI AGENT REQUEST END ===");
    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 Error processing Vapi agent request:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

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
