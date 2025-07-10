import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { mistral, createMistral } from "@ai-sdk/mistral";
import { streamText, experimental_generateImage as generateImage } from "ai";
import { NextRequest } from "next/server";
import { FileAttachment } from "@/lib/types";

// Allow streaming responses up to 60 seconds for combined text and image generation
export const maxDuration = 60;

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
      // Use URL if available (from Supabase storage), otherwise fall back to base64
      if (attachment.url) {
        return {
          type: "image" as const,
          image: attachment.url,
        };
      } else if (attachment.data) {
        // Fallback to base64 for backward compatibility
        return {
          type: "image" as const,
          image: `data:${attachment.mimeType};base64,${attachment.data}`,
        };
      } else {
        console.warn("Image attachment has no URL or data:", attachment);
        return {
          type: "text" as const,
          text: `[Image: ${attachment.name} - No data available]`,
        };
      }
    } else {
      // For non-image files, we'll include them as text content
      return {
        type: "text" as const,
        text: `[File: ${attachment.name} (${attachment.mimeType})]`,
      };
    }
  });
}

// Helper function to validate image attachments
function validateImageAttachments(
  attachments: FileAttachment[],
  model: string
) {
  const imageAttachments = attachments.filter((att) =>
    att.mimeType.startsWith("image/")
  );

  if (imageAttachments.length === 0) {
    return { valid: true };
  }

  // Check if model supports vision
  const visionModels = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-vision-preview",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
  ];

  if (!visionModels.includes(model)) {
    return {
      valid: false,
      error: `Model ${model} does not support image analysis. Please use a vision-capable model.`,
    };
  }

  // Validate image sizes (max 20MB per image for most models)
  const maxSize = 20 * 1024 * 1024; // 20MB
  for (const attachment of imageAttachments) {
    if (attachment.size > maxSize) {
      return {
        valid: false,
        error: `Image ${attachment.name} is too large (${Math.round(
          attachment.size / 1024 / 1024
        )}MB). Maximum size is 20MB.`,
      };
    }
  }

  return { valid: true };
}

// Helper function to detect image generation requests
function detectImageGenerationRequest(messages: any[]): {
  isImageRequest: boolean;
  imagePrompt?: string;
  imageOptions?: {
    size?: string;
    aspectRatio?: string;
    n?: number;
  };
} {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    return { isImageRequest: false };
  }

  const content =
    typeof lastMessage.content === "string"
      ? lastMessage.content
      : Array.isArray(lastMessage.content)
      ? lastMessage.content.find((c: any) => c.type === "text")?.text || ""
      : "";

  const lowerContent = content.toLowerCase();

  // Check for image generation keywords
  const imageKeywords = [
    "generate image",
    "create image",
    "make image",
    "draw",
    "picture of",
    "image of",
    "photo of",
    "generate a picture",
    "create a picture",
    "dall-e",
    "dalle",
    "image generation",
    "generate art",
    "create art",
  ];

  const isImageRequest = imageKeywords.some((keyword) =>
    lowerContent.includes(keyword)
  );

  if (!isImageRequest) {
    return { isImageRequest: false };
  }

  // Extract image options from the prompt
  const sizeMatch = content.match(/size[:\s]+(\d+x\d+)/i);
  const aspectMatch = content.match(/aspect[:\s]+(\d+:\d+)/i);
  const countMatch = content.match(/(\d+)\s+(images?|pictures?)/i);

  return {
    isImageRequest: true,
    imagePrompt: content,
    imageOptions: {
      size: sizeMatch ? sizeMatch[1] : "1024x1024",
      aspectRatio: aspectMatch ? aspectMatch[1] : undefined,
      n: countMatch ? parseInt(countMatch[1]) : 1,
    },
  };
}

// Helper function to validate image generation models
function validateImageGenerationModel(
  model: string,
  provider: string
): boolean {
  const imageGenerationModels: Record<string, string[]> = {
    openai: ["dall-e-3", "dall-e-2"],
    anthropic: [], // Anthropic doesn't have image generation models yet
    mistral: [], // Mistral doesn't have image generation models yet
  };

  return imageGenerationModels[provider]?.includes(model) || false;
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
      userId: body.userId,
    });

    const { messages, provider, model, userApiKey, attachments, userId } = body;

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

    // Validate image attachments if present
    if (attachments && attachments.length > 0) {
      const validation = validateImageAttachments(attachments, model);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            error: validation.error,
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
    }

    // Detect if this is an image generation request
    const imageRequest = detectImageGenerationRequest(messages);

    if (imageRequest.isImageRequest) {
      // Validate that the model supports image generation
      if (!validateImageGenerationModel(model, provider)) {
        return new Response(
          JSON.stringify({
            error: `Model ${model} does not support image generation. Please use a model that supports image generation like DALL-E 3 or DALL-E 2.`,
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

      // Handle image generation
      try {
        const openaiClient = createOpenAI({
          apiKey: userApiKey,
        });

        console.log("Generating image:", {
          requestId,
          prompt: imageRequest.imagePrompt?.substring(0, 100) + "...",
          model,
          options: imageRequest.imageOptions,
        });

        const imageResult = await generateImage({
          model: openaiClient.image(model),
          prompt: imageRequest.imagePrompt || "",
          size: imageRequest.imageOptions?.size as any,
          aspectRatio: imageRequest.imageOptions?.aspectRatio as any,
          n: imageRequest.imageOptions?.n || 1,
        });

        console.log("Image generation completed:", {
          requestId,
          model,
          imageCount: imageResult.images?.length || (imageResult.image ? 1 : 0),
          duration: Date.now() - startTime,
        });

        // Create image attachments for the response
        const imageAttachments = imageResult.images
          ? imageResult.images.map((img, index) => ({
              id: `generated-image-${index}`,
              name: `generated-image-${index + 1}.png`,
              type: "image/png",
              size: img.uint8Array.length,
              data: img.base64,
              mimeType: "image/png",
            }))
          : imageResult.image
          ? [
              {
                id: "generated-image-1",
                name: "generated-image.png",
                type: "image/png",
                size: imageResult.image.uint8Array.length,
                data: imageResult.image.base64,
                mimeType: "image/png",
              },
            ]
          : [];

        // Create a text response that includes the image data
        const responseText = `Generated ${
          imageResult.images?.length || (imageResult.image ? 1 : 0)
        } image${
          (imageResult.images?.length || 1) > 1 ? "s" : ""
        } based on your request.`;

        // Create a simple streaming response with the text and attachments
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            // Send the response text
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  id: `assistant-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 15)}`,
                  role: "assistant",
                  content: responseText,
                  attachments: imageAttachments,
                })}\n\n`
              )
            );

            // Send completion signal
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } catch (imageError) {
        logError(imageError, {
          requestId,
          model,
          errorType: "image_generation",
          promptLength: imageRequest.imagePrompt?.length || 0,
          duration: Date.now() - startTime,
        });

        throw imageError;
      }
    }

    // Handle regular text generation
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
