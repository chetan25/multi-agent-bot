"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Image, Download, Copy, Loader2 } from "lucide-react";
import { ImageGenerationRequest, ImageGenerationResponse } from "@/lib/types";

interface ImageGenerationComponentProps {
  model: string;
  userApiKey: string;
  onImageGenerated?: (
    images: { base64: string; uint8Array: number[] }[]
  ) => void;
}

export function ImageGenerationComponent({
  model,
  userApiKey,
  onImageGenerated,
}: ImageGenerationComponentProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<
    { base64: string; uint8Array: number[] }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState({
    size: "1024x1024" as string,
    n: 1,
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const request: ImageGenerationRequest = {
        prompt: prompt.trim(),
        model,
        userApiKey,
        size: options.size,
        n: options.n,
      };

      const response = await fetch("/api/image-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const result: ImageGenerationResponse = await response.json();

      const images = result.images || (result.image ? [result.image] : []);
      setGeneratedImages(images);

      if (onImageGenerated && images.length > 0) {
        onImageGenerated(images);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (
    imageData: { base64: string; uint8Array: number[] },
    index: number
  ) => {
    try {
      const blob = new Blob([new Uint8Array(imageData.uint8Array)], {
        type: "image/png",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `generated-image-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Error downloading image:", err);
    }
  };

  const handleCopyBase64 = async (base64: string) => {
    try {
      await navigator.clipboard.writeText(base64);
    } catch (err) {
      console.error("Error copying base64:", err);
    }
  };

  const isDalle3 = model === "dall-e-3";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Generate Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Prompt</label>
          <Input
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
            disabled={isGenerating}
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Options</label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Size</label>
              <select
                value={options.size}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    size: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded text-sm"
                disabled={isGenerating}
              >
                <option value="256x256">256x256</option>
                <option value="512x512">512x512</option>
                <option value="1024x1024">1024x1024</option>
                {isDalle3 && (
                  <>
                    <option value="1792x1024">1792x1024</option>
                    <option value="1024x1792">1024x1792</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600">Count</label>
              <select
                value={options.n}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    n: parseInt(e.target.value),
                  }))
                }
                className="w-full p-2 border rounded text-sm"
                disabled={isGenerating}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Image className="mr-2 h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3">
                Generated Images ({generatedImages.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((image, index) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden"
                  >
                    <img
                      src={`data:image/png;base64,${image.base64}`}
                      alt={`Generated image ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3 bg-gray-50 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(image, index)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyBase64(image.base64)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
