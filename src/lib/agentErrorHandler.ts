// Error handling utilities for Google Drive Agent

export interface AgentError {
  type:
    | "authentication"
    | "permission"
    | "not_found"
    | "quota"
    | "network"
    | "validation"
    | "unknown";
  message: string;
  details?: string;
  suggestions: string[];
  retryable: boolean;
}

export class AgentErrorHandler {
  // Map Google Drive API errors to user-friendly messages
  static handleGoogleDriveError(error: any, operation: string): AgentError {
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    const lowerError = errorMessage.toLowerCase();

    // Authentication errors
    if (
      lowerError.includes("unauthorized") ||
      lowerError.includes("invalid credentials")
    ) {
      return {
        type: "authentication",
        message:
          "I need to reconnect to your Google Drive. Please sign in again.",
        details: errorMessage,
        suggestions: [
          "Sign in to Google Drive again",
          "Check your Google account permissions",
        ],
        retryable: false,
      };
    }

    // Permission errors
    if (
      lowerError.includes("forbidden") ||
      lowerError.includes("permission denied")
    ) {
      return {
        type: "permission",
        message: `I don't have permission to ${operation}. Please check the file permissions.`,
        details: errorMessage,
        suggestions: [
          "Check file sharing settings",
          "Make sure you own the file",
          "Try a different file",
        ],
        retryable: false,
      };
    }

    // Not found errors
    if (
      lowerError.includes("not found") ||
      lowerError.includes("file not found")
    ) {
      return {
        type: "not_found",
        message: `The file or folder you're looking for doesn't exist or has been moved.`,
        details: errorMessage,
        suggestions: [
          "Check the file name",
          "Search for the file",
          "List your files to see what's available",
        ],
        retryable: false,
      };
    }

    // Quota errors
    if (lowerError.includes("quota") || lowerError.includes("storage full")) {
      return {
        type: "quota",
        message:
          "Your Google Drive storage is full. I cannot create or upload files.",
        details: errorMessage,
        suggestions: [
          "Free up space in Google Drive",
          "Delete unnecessary files",
          "Upgrade your storage plan",
        ],
        retryable: false,
      };
    }

    // Network errors
    if (
      lowerError.includes("network") ||
      lowerError.includes("timeout") ||
      lowerError.includes("connection")
    ) {
      return {
        type: "network",
        message:
          "I had trouble connecting to Google Drive. Please check your internet connection.",
        details: errorMessage,
        suggestions: [
          "Check your internet connection",
          "Try again in a moment",
          "Restart the voice call",
        ],
        retryable: true,
      };
    }

    // Validation errors
    if (lowerError.includes("invalid") || lowerError.includes("bad request")) {
      return {
        type: "validation",
        message: `I couldn't ${operation} because the request was invalid.`,
        details: errorMessage,
        suggestions: [
          "Try rephrasing your request",
          "Provide more specific details",
          "Check file names for special characters",
        ],
        retryable: false,
      };
    }

    // Default unknown error
    return {
      type: "unknown",
      message: `I encountered an unexpected error while trying to ${operation}.`,
      details: errorMessage,
      suggestions: [
        "Try again",
        "Rephrase your request",
        "Contact support if the problem persists",
      ],
      retryable: true,
    };
  }

  // Handle agent-specific errors
  static handleAgentError(error: any, context: string): AgentError {
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    const lowerError = errorMessage.toLowerCase();

    // Intent parsing errors
    if (lowerError.includes("intent") || lowerError.includes("parse")) {
      return {
        type: "validation",
        message:
          "I didn't understand what you wanted me to do. Could you please rephrase that?",
        details: errorMessage,
        suggestions: [
          "Try saying it differently",
          "Be more specific about what you want",
          "Use simpler language",
        ],
        retryable: false,
      };
    }

    // Parameter validation errors
    if (lowerError.includes("parameter") || lowerError.includes("missing")) {
      return {
        type: "validation",
        message:
          "I need more information to help you. Could you provide more details?",
        details: errorMessage,
        suggestions: [
          "Specify file names",
          "Provide email addresses for sharing",
          "Mention which folder you want to work with",
        ],
        retryable: false,
      };
    }

    // Timeout errors
    if (lowerError.includes("timeout") || lowerError.includes("timed out")) {
      return {
        type: "network",
        message: "The operation took too long to complete. Please try again.",
        details: errorMessage,
        suggestions: [
          "Try a simpler request",
          "Wait a moment and try again",
          "Break your request into smaller parts",
        ],
        retryable: true,
      };
    }

    // Default agent error
    return {
      type: "unknown",
      message: "I encountered an error while processing your request.",
      details: errorMessage,
      suggestions: [
        "Try again",
        "Rephrase your request",
        "Start a new voice call",
      ],
      retryable: true,
    };
  }

  // Generate user-friendly error message
  static generateErrorMessage(error: AgentError, operation?: string): string {
    if (error.type === "authentication") {
      return "I need to reconnect to your Google Drive. Please sign in again in the app.";
    }

    if (error.type === "permission") {
      return `I don't have permission to ${
        operation || "access that file"
      }. Please check the file's sharing settings.`;
    }

    if (error.type === "not_found") {
      return "The file or folder you mentioned doesn't exist or has been moved.";
    }

    if (error.type === "quota") {
      return "Your Google Drive storage is full. I cannot create or upload files right now.";
    }

    if (error.type === "network") {
      return "I had trouble connecting to Google Drive. Please check your internet connection and try again.";
    }

    if (error.type === "validation") {
      return `I couldn't ${
        operation || "complete that action"
      } because I need more information.`;
    }

    return "I encountered an unexpected error. Please try again or rephrase your request.";
  }

  // Check if error is retryable
  static isRetryableError(error: AgentError): boolean {
    return error.retryable;
  }

  // Get recovery suggestions
  static getRecoverySuggestions(error: AgentError): string[] {
    return error.suggestions;
  }

  // Log error for debugging
  static logError(error: AgentError, context: string, userId?: string): void {
    console.error("Agent Error:", {
      type: error.type,
      message: error.message,
      details: error.details,
      context,
      userId,
      timestamp: new Date().toISOString(),
      retryable: error.retryable,
    });
  }
}
