import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  FileAttachment,
} from "./types";

export class MultimodalService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  }

  /**
   * Generate images using the image generation API
   */
  async generateImages(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/image-generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating images:", error);
      throw error;
    }
  }

  /**
   * Send a chat message with optional image attachments
   */
  async sendChatMessage(
    messages: any[],
    provider: string,
    model: string,
    userApiKey: string,
    attachments?: FileAttachment[]
  ): Promise<Response> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          provider,
          model,
          userApiKey,
          attachments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return response;
    } catch (error) {
      console.error("Error sending chat message:", error);
      throw error;
    }
  }

  /**
   * Validate if a model supports image analysis
   */
  isVisionModel(model: string): boolean {
    const visionModels = [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-vision-preview",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ];
    return visionModels.includes(model);
  }

  /**
   * Validate if a model supports image generation
   */
  isImageGenerationModel(model: string): boolean {
    const imageGenerationModels = ["dall-e-3", "dall-e-2"];
    return imageGenerationModels.includes(model);
  }
}

// Export a singleton instance
export const multimodalService = new MultimodalService();
