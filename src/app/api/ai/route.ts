import { NextRequest } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createFileTool, createFolderTool } from "@/lib/googleDriveTools";
import {
  getAuthenticatedUser,
  getUserGoogleTokens,
} from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
      });
    }

    // Validate user authentication
    let authenticatedUser;
    try {
      authenticatedUser = await getAuthenticatedUser();

      // Ensure the userId matches the authenticated user
      if (userId && userId !== authenticatedUser.id) {
        return new Response(JSON.stringify({ error: "User ID mismatch" }), {
          status: 403,
        });
      }

      // Use the authenticated user's ID
      const actualUserId = authenticatedUser.id;

      // Verify user has Google Drive connected
      try {
        await getUserGoogleTokens(actualUserId);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Google Drive not connected",
            message: "Please connect your Google Drive account first.",
          }),
          { status: 403 }
        );
      }

      // Create the prompt with user context
      const prompt = `
You are a helpful assistant that helps users create Google Drive files and folders.

Available operations:
- Create files: Create new documents with content
- Create folders: Organize files into folders

IMPORTANT: When using tools, you MUST include the userId parameter with value "${actualUserId}".

When a user asks to create something, use the appropriate tool to perform the action.

User message: "${message}"

Please analyze this request and use the appropriate tool to help the user. Remember to include userId: "${actualUserId}" in your tool calls.
`;

      // Generate content with tools using AI SDK
      const { text, toolResults } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        tools: {
          createFile: createFileTool,
          createFolder: createFolderTool,
        },
      });

      // Check if any tools were executed
      if (toolResults && toolResults.length > 0) {
        const lastToolResult = toolResults[toolResults.length - 1];

        if (lastToolResult.result.success) {
          return new Response(
            JSON.stringify({
              message: lastToolResult.result.message,
              success: true,
              toolUsed: lastToolResult.toolName,
              result: lastToolResult.result,
            }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        } else {
          return new Response(
            JSON.stringify({
              message: `Failed to ${lastToolResult.toolName}: ${lastToolResult.result.error}`,
              success: false,
              error: lastToolResult.result.error,
              toolUsed: lastToolResult.toolName,
            }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // If no tools were used, return the LLM response
      return new Response(
        JSON.stringify({
          message: text,
          success: true,
          llmResponse: text,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          message: "Please sign in to use this feature.",
        }),
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error in AI route:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "I encountered an error processing your request.",
      }),
      { status: 500 }
    );
  }
}
