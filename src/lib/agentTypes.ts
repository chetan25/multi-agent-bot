// Agent Types for Google Drive Operations

// Base agent request interface
export interface AgentRequest {
  sessionId: string;
  userId: string;
  message: string; // Natural language request from user
  context?: AgentContext;
}

// Agent context to maintain conversation state
export interface AgentContext {
  conversationId?: string;
  previousOperations?: AgentOperation[];
  currentFolder?: string;
  selectedFiles?: string[];
  userPreferences?: Record<string, any>;
}

// Available Google Drive operations
export type DriveOperationType =
  | "list_files"
  | "search_files"
  | "create_file"
  | "create_folder"
  | "read_file"
  | "update_file"
  | "delete_file"
  | "share_file"
  | "upload_file"
  | "get_file_details"
  | "move_file"
  | "copy_file";

// Tool definition for Google Drive operations
export interface DriveTool {
  name: DriveOperationType;
  description: string;
  parameters: {
    type: "object";
    properties: Record<
      string,
      {
        type: string;
        description: string;
        required?: boolean;
      }
    >;
    required: string[];
  };
}

// Agent operation result
export interface AgentOperation {
  type: DriveOperationType;
  status: "success" | "error" | "pending";
  result?: any;
  error?: string;
  timestamp: string;
  parameters?: Record<string, any>;
}

// Agent response structure
export interface AgentResponse {
  message: string; // Natural language response to user
  operations: AgentOperation[];
  status: "completed" | "partial" | "error";
  context?: AgentContext;
  suggestions?: string[]; // Suggested follow-up actions
}

// Intent parsing result
export interface ParsedIntent {
  primaryAction: DriveOperationType;
  secondaryActions?: DriveOperationType[];
  parameters: Record<string, any>;
  confidence: number;
  requiresClarification: boolean;
  clarificationQuestions?: string[];
}

// Tool execution result
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    apiCalls: number;
  };
}

// Agent configuration
export interface AgentConfig {
  maxOperationsPerRequest: number;
  timeoutMs: number;
  retryAttempts: number;
  enableSuggestions: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

// Default agent configuration
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxOperationsPerRequest: 5,
  timeoutMs: 30000,
  retryAttempts: 3,
  enableSuggestions: true,
  logLevel: "info",
};
