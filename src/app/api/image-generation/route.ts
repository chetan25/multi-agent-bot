import { experimental_generateImage as generateImage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest } from "next/server";
import { ImageGenerationRequest, ImageGenerationResponse } from "@/lib/types";

// Allow responses up to 60 seconds for image generation
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

  console.error(
    "Image Generation API Error:",
    JSON.stringify(errorLog, null, 2)
  );
}

// Test endpoint to verify the API is working
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      message: "Image Generation API is working",
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
    console.log("Image Generation API route received:", {
      requestId,
      prompt: body.prompt?.substring(0, 100) + "...",
      provider: body.provider,
      model: body.model,
      hasUserApiKey: !!body.userApiKey,
      options: body.options,
    });

    const { prompt, model, userApiKey, size, aspectRatio, n } = body;

    if (!prompt || !model || !userApiKey) {
      const missingParams = {
        prompt: !prompt,
        model: !model,
        userApiKey: !userApiKey,
      };

      logError(new Error("Missing required parameters"), {
        requestId,
        missingParams,
        receivedData: {
          hasPrompt: !!prompt,
          model,
          hasUserApiKey: !!userApiKey,
        },
      });

      return new Response(
        JSON.stringify({
          error: "Missing required parameters: prompt, model, or userApiKey",
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

    // Validate that the model supports image generation
    const imageGenerationModels = ["dall-e-3", "dall-e-2"];
    if (!imageGenerationModels.includes(model)) {
      return new Response(
        JSON.stringify({
          error: "Model does not support image generation",
          details: { model, supportedModels: imageGenerationModels },
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

    try {
      // Create OpenAI client with user's API key
      const openai = createOpenAI({
        apiKey: userApiKey,
      });

      console.log("Creating OpenAI client for image generation:", {
        requestId,
        model,
        userApiKeyLength: userApiKey?.length || 0,
      });

      // Generate image using AI SDK
      const result = await generateImage({
        model: openai.image(model),
        prompt,
        size,
        aspectRatio,
        n: n || 1,
      });

      console.log("Image generation completed:", {
        requestId,
        model,
        imageCount: result.images?.length || result.image ? 1 : 0,
        duration: Date.now() - startTime,
      });

      // Return the generated image(s)
      if (result.images) {
        // Multiple images
        return new Response(
          JSON.stringify({
            images: result.images.map((img) => ({
              base64: img.base64,
              uint8Array: Array.from(img.uint8Array),
            })),
            count: result.images.length,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } else if (result.image) {
        // Single image
        return new Response(
          JSON.stringify({
            image: {
              base64: result.image.base64,
              uint8Array: Array.from(result.image.uint8Array),
            },
            count: 1,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        throw new Error("No image generated");
      }
    } catch (generationError) {
      logError(generationError, {
        requestId,
        model,
        errorType: "image_generation",
        promptLength: prompt.length,
        duration: Date.now() - startTime,
      });

      throw generationError;
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

    return new Response(
      JSON.stringify({
        error: "Failed to generate image",
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
