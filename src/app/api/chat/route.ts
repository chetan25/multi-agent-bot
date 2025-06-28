import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { mistral, createMistral } from "@ai-sdk/mistral";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { FileAttachment } from "@/lib/types";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Helper function to log errors with context
function logError(error: any, context: any) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: error?.name || "Unknown",
      message: error?.message || "Unknown error",
      stack: error?.stack || null,
    },
    context,
    requestId: context.requestId || "unknown",
  };

  console.error("Chat API Error:", JSON.stringify(errorLog, null, 2));
}

// Helper function to convert file attachments to AI SDK format
function convertAttachmentsToAISDK(attachments: FileAttachment[]) {
  return attachments.map((attachment) => {
    if (attachment.mimeType.startsWith("image/")) {
      return {
        type: "image" as const,
        image: `data:${attachment.mimeType};base64,${attachment.data}`,
      };
    } else {
      // For non-image files, we'll include them as text content
      return {
        type: "text" as const,
        text: `[File: ${attachment.name} (${attachment.mimeType})]`,
      };
    }
  });
}

// Test endpoint to verify the API is working
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      message: "Chat API is working",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    const body = await req.json();
    console.log("API route received:", {
      requestId,
      hasMessages: !!body.messages,
      provider: body.provider,
      model: body.model,
      hasUserApiKey: !!body.userApiKey,
      messageCount: body.messages?.length || 0,
      hasAttachments: !!body.attachments,
      attachmentCount: body.attachments?.length || 0,
    });

    const { messages, provider, model, userApiKey, attachments } = body;

    if (!messages || !provider || !model || !userApiKey) {
      const missingParams = {
        messages: !messages,
        provider: !provider,
        model: !model,
        userApiKey: !userApiKey,
      };

      logError(new Error("Missing required parameters"), {
        requestId,
        missingParams,
        receivedData: {
          hasMessages: !!messages,
          provider,
          model,
          hasUserApiKey: !!userApiKey,
        },
      });

      return new Response(
        JSON.stringify({
          error:
            "Missing required parameters: messages, provider, model, or userApiKey",
          details: missingParams,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );
    }

    let modelInstance;

    try {
      // Create dynamic clients with user-provided API keys
      switch (provider) {
        case "openai":
          // Create a dynamic OpenAI client with the user-provided key
          modelInstance = createOpenAI({
            apiKey: userApiKey, // ✅ required
          })(model);
          break;
        case "anthropic":
          // Create a dynamic Anthropic client with the user-provided key
          modelInstance = createAnthropic({
            apiKey: userApiKey, // ✅ required
          })(model);
          break;
        case "mistral":
          // Create a dynamic Mistral client with the user-provided key
          modelInstance = createMistral({
            apiKey: userApiKey, // ✅ required
          })(model);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      console.log("Creating model instance for:", {
        requestId,
        provider,
        model,
        userApiKeyLength: userApiKey?.length || 0,
      });
    } catch (modelError) {
      logError(modelError, {
        requestId,
        provider,
        model,
        errorType: "model_initialization",
        userApiKeyLength: userApiKey?.length || 0,
      });

      throw modelError;
    }

    console.log({ modelInstance });
    try {
      // Process messages to include attachments if present
      const processedMessages = messages.map((message: any) => {
        // Check if this is the last user message and we have attachments
        const isLastUserMessage =
          message.role === "user" &&
          message === messages[messages.length - 1] &&
          attachments &&
          attachments.length > 0;

        if (isLastUserMessage) {
          // For the last user message with attachments, create a multi-modal message
          const content = [
            { type: "text" as const, text: message.content || "" },
            ...convertAttachmentsToAISDK(attachments),
          ];
          return {
            ...message,
            content,
          };
        }
        return message;
      });

      console.log("Processing messages with attachments:", {
        requestId,
        originalMessageCount: messages.length,
        processedMessageCount: processedMessages.length,
        hasAttachments: !!attachments,
        attachmentCount: attachments?.length || 0,
        lastMessageRole: messages[messages.length - 1]?.role,
        isLastMessageUser: messages[messages.length - 1]?.role === "user",
      });

      // Use the AI SDK's streamText function to get the streaming response
      const result = await streamText({
        model: modelInstance,
        messages: processedMessages,
      });

      console.log("Streaming result created successfully", {
        requestId,
        provider,
        model,
        duration: Date.now() - startTime,
      });

      // Return the streaming response using the AI SDK's built-in method
      return result.toDataStreamResponse();
    } catch (streamError) {
      logError(streamError, {
        requestId,
        provider,
        model,
        errorType: "stream_generation",
        messageCount: messages?.length || 0,
        duration: Date.now() - startTime,
      });

      throw streamError;
    }
  } catch (error) {
    logError(error, {
      requestId,
      errorType: "general",
      duration: Date.now() - startTime,
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
    });

    // Return error in the format expected by @ai-sdk/react
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
        requestId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}
