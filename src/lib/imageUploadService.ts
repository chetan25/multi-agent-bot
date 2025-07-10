import { supabase } from "./supabase-client";
import { FileAttachment } from "./types";

export class ImageUploadService {
  private supabase = supabase;

  /**
   * Upload an image file to Supabase storage
   */
  async uploadImage(file: File, userId: string): Promise<FileAttachment> {
    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();

      if (authError) {
        console.warn("Auth error, but continuing with upload:", authError);
      }

      if (!user) {
        console.warn(
          "No authenticated user found, attempting upload anyway..."
        );
      } else if (user.id !== userId) {
        console.warn("User ID mismatch, but continuing with upload");
      }

      // Generate a unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      console.log("Uploading image:", {
        fileName,
        userId,
        authenticatedUserId: user?.id,
        fileSize: file.size,
        fileType: file.type,
      });

      // Upload to Supabase storage
      const { data, error } = await this.supabase.storage
        .from("chat-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading image:", error);

        // If it's an RLS error, provide helpful message
        if (error.message.includes("row-level security")) {
          throw new Error(
            `RLS policy blocked upload. Try disabling RLS temporarily or check authentication. Original error: ${error.message}`
          );
        }

        throw new Error(`Failed to upload image: ${error.message}`);
      }

      console.log("Image uploaded successfully:", data);

      // Generate a signed URL for immediate use
      const { data: urlData, error: urlError } = await this.supabase.storage
        .from("chat-images")
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (urlError) {
        console.error("Error creating signed URL:", urlError);
        throw new Error(`Failed to create signed URL: ${urlError.message}`);
      }

      // Create FileAttachment object with both file path and signed URL
      const attachment: FileAttachment = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        data: "", // No base64 data needed
        url: urlData.signedUrl, // Use signed URL for immediate access
        mimeType: file.type,
        filePath: fileName, // Store the file path for future signed URL generation
      };

      return attachment;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  }

  /**
   * Get a signed URL for a private image (valid for 1 hour)
   */
  async getSignedUrl(filePath: string): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from("chat-images")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error("Error creating signed URL:", error);
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error("Signed URL error:", error);
      throw error;
    }
  }

  /**
   * Get signed URLs for multiple images
   */
  async getSignedUrls(filePaths: string[]): Promise<string[]> {
    const signedUrlPromises = filePaths.map((path) => this.getSignedUrl(path));
    return Promise.all(signedUrlPromises);
  }

  /**
   * Upload multiple images and return FileAttachments
   */
  async uploadImages(files: File[], userId: string): Promise<FileAttachment[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, userId));
    return Promise.all(uploadPromises);
  }

  /**
   * Convert File objects to FileAttachment with file paths
   */
  async processFiles(files: File[], userId: string): Promise<FileAttachment[]> {
    try {
      // uploadImages now returns FileAttachment[] directly
      return await this.uploadImages(files, userId);
    } catch (error) {
      console.error("Error processing files:", error);
      throw error;
    }
  }

  /**
   * Delete an image from Supabase storage
   */
  async deleteImage(filePath: string): Promise<void> {
    try {
      // If it's a full URL, extract the file path
      let pathToDelete = filePath;

      // If it's a data URL, we can't delete it from storage
      if (filePath.startsWith("data:")) {
        console.warn("Cannot delete data URL from storage:", filePath);
        return;
      }

      // If it's a signed URL, extract the path from the URL
      if (filePath.includes("?") && filePath.includes("supabase.co")) {
        const urlParts = filePath.split("?")[0].split("/");
        const bucketIndex = urlParts.findIndex((part) => part === "storage");
        if (bucketIndex !== -1 && urlParts[bucketIndex + 2]) {
          pathToDelete = urlParts.slice(bucketIndex + 2).join("/");
        }
      }

      const { error } = await this.supabase.storage
        .from("chat-images")
        .remove([pathToDelete]);

      if (error) {
        console.error("Error deleting image:", error);
        throw new Error(`Failed to delete image: ${error.message}`);
      }
    } catch (error) {
      console.error("Image deletion error:", error);
      throw error;
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "File must be an image" };
    }

    // Check file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Image is too large (${Math.round(
          file.size / 1024 / 1024
        )}MB). Maximum size is 20MB.`,
      };
    }

    return { valid: true };
  }
}

// Export a singleton instance
export const imageUploadService = new ImageUploadService();
