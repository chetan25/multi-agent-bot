import {
  AgentRequest,
  AgentResponse,
  AgentContext,
  ParsedIntent,
  AgentOperation,
  AgentConfig,
  DEFAULT_AGENT_CONFIG,
  DriveOperationType,
} from "./agentTypes";
import { GoogleDriveTools } from "./googleDriveTools";
import { AgentErrorHandler } from "./agentErrorHandler";

export class GoogleDriveAgent {
  private tools: GoogleDriveTools;
  private config: AgentConfig;
  private context: AgentContext;

  constructor(config: Partial<AgentConfig> = {}) {
    this.tools = new GoogleDriveTools();
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
    this.context = {};
  }

  // Main method to process a natural language request
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    try {
      // Update context with request context
      this.context = { ...this.context, ...request.context };

      // Parse the natural language intent
      const parsedIntent = this.parseIntent(request.message);

      if (parsedIntent.requiresClarification) {
        return this.createClarificationResponse(parsedIntent);
      }

      // Execute the primary action
      const operations: AgentOperation[] = [];
      let status: "completed" | "partial" | "error" = "completed";

      // Execute primary action
      const primaryResult = await this.executeOperation(
        parsedIntent.primaryAction,
        parsedIntent.parameters
      );
      operations.push(primaryResult);

      if (primaryResult.status === "error") {
        status = "error";
      }

      // Execute secondary actions if any
      if (
        parsedIntent.secondaryActions &&
        operations.length < this.config.maxOperationsPerRequest
      ) {
        for (const secondaryAction of parsedIntent.secondaryActions) {
          if (operations.length >= this.config.maxOperationsPerRequest) break;

          const secondaryResult = await this.executeOperation(
            secondaryAction,
            parsedIntent.parameters
          );
          operations.push(secondaryResult);

          if (secondaryResult.status === "error") {
            status = "partial";
          }
        }
      }

      // Update context with completed operations
      this.context.previousOperations = operations;

      // Generate natural language response
      const message = this.generateResponse(operations, parsedIntent);

      // Generate suggestions
      const suggestions = this.config.enableSuggestions
        ? this.generateSuggestions(operations)
        : [];

      return {
        message,
        operations,
        status,
        context: this.context,
        suggestions,
      };
    } catch (error) {
      console.error("Error processing agent request:", error);

      return {
        message:
          "I encountered an error while processing your request. Please try again.",
        operations: [],
        status: "error",
        context: this.context,
        suggestions: [
          "Try rephrasing your request",
          "Check if you have the necessary permissions",
        ],
      };
    }
  }

  // Parse natural language to determine intent and parameters
  private parseIntent(message: string): ParsedIntent {
    const lowerMessage = message.toLowerCase();

    // Define intent patterns
    const patterns = {
      list_files: [
        /(?:list|show|display|get|find|see).*(?:files?|folders?|documents?)/i,
        /(?:what|which).*(?:files?|folders?|documents?).*(?:in|are|do).*(?:have|contain)/i,
        /(?:browse|explore).*(?:files?|folders?)/i,
      ],
      search_files: [
        /(?:search|find|look).*(?:for|up).*(?:files?|documents?|folders?)/i,
        /(?:where).*(?:is|are).*(?:my|the).*(?:files?|documents?)/i,
      ],
      create_file: [
        /(?:create|make|new|add).*(?:file|document|note|text)/i,
        /(?:write|save).*(?:a|an|new).*(?:file|document)/i,
      ],
      create_folder: [
        /(?:create|make|new|add).*(?:folder|directory)/i,
        /(?:organize).*(?:files?).*(?:into).*(?:folder|directory)/i,
      ],
      read_file: [
        /(?:read|open|view|show).*(?:file|document)/i,
        /(?:what).*(?:is|does).*(?:the|this).*(?:file|document).*(?:contain|say)/i,
      ],
      update_file: [
        /(?:edit|modify|change|update).*(?:file|document)/i,
        /(?:add|append).*(?:to|in).*(?:file|document)/i,
      ],
      delete_file: [
        /(?:delete|remove|trash|erase).*(?:file|document|folder)/i,
        /(?:get).*(?:rid).*(?:of).*(?:file|document)/i,
      ],
      share_file: [
        /(?:share|send|give).*(?:access).*(?:to)/i,
        /(?:share|send).*(?:file|document).*(?:with)/i,
      ],
      get_file_details: [
        /(?:details|info|information).*(?:about|for).*(?:file|document)/i,
        /(?:what).*(?:is).*(?:the).*(?:size|date|name).*(?:of)/i,
      ],
    };

    // Find matching pattern and extract parameters
    for (const [operation, operationPatterns] of Object.entries(patterns)) {
      for (const pattern of operationPatterns) {
        if (pattern.test(lowerMessage)) {
          const parameters = this.extractParameters(
            lowerMessage,
            operation as DriveOperationType
          );
          return {
            primaryAction: operation as DriveOperationType,
            parameters,
            confidence: 0.8,
            requiresClarification: this.needsClarification(
              operation as DriveOperationType,
              parameters
            ),
            clarificationQuestions: this.getClarificationQuestions(
              operation as DriveOperationType,
              parameters
            ),
          };
        }
      }
    }

    // Default to search if no specific pattern matches
    return {
      primaryAction: "search_files",
      parameters: { query: message },
      confidence: 0.3,
      requiresClarification: true,
      clarificationQuestions: ["What would you like me to help you with?"],
    };
  }

  // Extract parameters from natural language
  private extractParameters(
    message: string,
    operation: DriveOperationType
  ): Record<string, any> {
    const parameters: Record<string, any> = {};
    const lowerMessage = message.toLowerCase();

    switch (operation) {
      case "list_files":
        // Extract folder reference
        if (lowerMessage.includes("root") || lowerMessage.includes("main")) {
          parameters.folderId = "root";
        } else if (lowerMessage.includes("current")) {
          parameters.folderId = this.context.currentFolder || "root";
        }
        break;

      case "search_files":
        // Extract search query
        const searchMatch = message.match(
          /(?:search|find|look).*?(?:for|up)\s+(.+?)(?:\s|$)/i
        );
        if (searchMatch) {
          parameters.query = searchMatch[1].trim();
        } else {
          // Extract words after "where is" or similar
          const whereMatch = message.match(
            /(?:where).*?(?:is|are).*?(?:my|the)\s+(.+?)(?:\s|$)/i
          );
          if (whereMatch) {
            parameters.query = whereMatch[1].trim();
          }
        }
        break;

      case "create_file":
        // Extract file name
        const fileNameMatch = message.match(
          /(?:create|make|new|add).*?(?:file|document|note|text)\s+(?:called\s+)?(.+?)(?:\s|$)/i
        );
        if (fileNameMatch) {
          parameters.fileName = fileNameMatch[1].trim();
        }

        // Extract content hints
        if (lowerMessage.includes("summary") || lowerMessage.includes("note")) {
          parameters.content = "Summary document";
        }
        break;

      case "create_folder":
        // Extract folder name
        const folderNameMatch = message.match(
          /(?:create|make|new|add).*?(?:folder|directory)\s+(?:called\s+)?(.+?)(?:\s|$)/i
        );
        if (folderNameMatch) {
          parameters.folderName = folderNameMatch[1].trim();
        }
        break;

      case "read_file":
      case "update_file":
      case "delete_file":
      case "get_file_details":
        // Extract file reference
        const fileMatch = message.match(
          /(?:read|open|view|show|edit|modify|change|update|delete|remove|trash|erase|details|info|information).*?(?:file|document)\s+(.+?)(?:\s|$)/i
        );
        if (fileMatch) {
          parameters.fileId = fileMatch[1].trim();
        }
        break;

      case "share_file":
        // Extract email
        const emailMatch = message.match(
          /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
        );
        if (emailMatch) {
          parameters.email = emailMatch[1];
        }

        // Extract file reference
        const shareFileMatch = message.match(
          /(?:share|send).*?(?:file|document)\s+(.+?)(?:\s+with|\s|$)/i
        );
        if (shareFileMatch) {
          parameters.fileId = shareFileMatch[1].trim();
        }
        break;
    }

    return parameters;
  }

  // Check if operation needs clarification
  private needsClarification(
    operation: DriveOperationType,
    parameters: Record<string, any>
  ): boolean {
    const tool = this.tools.getToolSchema(operation);
    if (!tool) return true;

    const requiredParams = tool.parameters.required || [];
    return !requiredParams.every((param) => parameters[param]);
  }

  // Get clarification questions
  private getClarificationQuestions(
    operation: DriveOperationType,
    parameters: Record<string, any>
  ): string[] {
    const questions: string[] = [];
    const tool = this.tools.getToolSchema(operation);

    if (!tool) {
      questions.push("What would you like me to help you with?");
      return questions;
    }

    const requiredParams = tool.parameters.required || [];
    const missingParams = requiredParams.filter((param) => !parameters[param]);

    for (const param of missingParams) {
      switch (param) {
        case "fileName":
          questions.push("What would you like to name the file?");
          break;
        case "folderName":
          questions.push("What would you like to name the folder?");
          break;
        case "content":
          questions.push("What content would you like in the file?");
          break;
        case "query":
          questions.push("What would you like me to search for?");
          break;
        case "fileId":
          questions.push("Which file would you like me to work with?");
          break;
        case "email":
          questions.push("What email address would you like to share with?");
          break;
        default:
          questions.push(`What ${param} would you like me to use?`);
      }
    }

    return questions;
  }

  // Execute a single operation
  private async executeOperation(
    operation: DriveOperationType,
    parameters: Record<string, any>
  ): Promise<AgentOperation> {
    try {
      // Validate parameters
      if (!this.tools.validateToolParameters(operation, parameters)) {
        return {
          type: operation,
          status: "error",
          error: "Missing required parameters",
          timestamp: new Date().toISOString(),
          parameters,
        };
      }

      // Execute the tool
      const result = await this.tools.executeTool(operation, parameters);

      // Create agent operation
      return this.tools.createAgentOperation(operation, parameters, result);
    } catch (error) {
      return {
        type: operation,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        parameters,
      };
    }
  }

  // Generate natural language response
  private generateResponse(
    operations: AgentOperation[],
    intent: ParsedIntent
  ): string {
    if (operations.length === 0) {
      return "I couldn't complete any operations. Please try again.";
    }

    const successfulOps = operations.filter((op) => op.status === "success");
    const failedOps = operations.filter((op) => op.status === "error");

    if (successfulOps.length === 0) {
      return `I encountered errors while trying to ${intent.primaryAction}. ${
        failedOps[0]?.error || "Please try again."
      }`;
    }

    // Generate response based on operation type
    const primaryOp = successfulOps[0];
    switch (primaryOp.type) {
      case "list_files":
        const files = primaryOp.result?.files || [];
        return `I found ${files.length} items in the folder. ${
          files.length > 0
            ? "The files include: " +
              files
                .slice(0, 3)
                .map((f: any) => f.name)
                .join(", ") +
              (files.length > 3 ? " and more..." : "")
            : ""
        }`;

      case "search_files":
        const searchResults = primaryOp.result?.files || [];
        return `I found ${searchResults.length} files matching your search. ${
          searchResults.length > 0
            ? "Results include: " +
              searchResults
                .slice(0, 3)
                .map((f: any) => f.name)
                .join(", ") +
              (searchResults.length > 3 ? " and more..." : "")
            : ""
        }`;

      case "create_file":
        return `I've successfully created the file "${
          primaryOp.parameters?.fileName || "your file"
        }" with your content.`;

      case "create_folder":
        return `I've successfully created the folder "${
          primaryOp.parameters?.folderName || "your folder"
        }".`;

      case "read_file":
        const content =
          primaryOp.result?.content || primaryOp.result?.title || "the file";
        return `I've read ${content}. The file contains the requested information.`;

      case "update_file":
        return `I've successfully updated the file with your new content.`;

      case "delete_file":
        return `I've successfully deleted the file.`;

      case "share_file":
        return `I've successfully shared the file with ${
          primaryOp.parameters?.email || "the specified user"
        }.`;

      case "get_file_details":
        const details = primaryOp.result;
        return `File details: ${details?.name || "Unknown file"}, size: ${
          details?.size || "Unknown"
        }, modified: ${details?.modifiedTime || "Unknown"}.`;

      default:
        return `I've successfully completed the ${primaryOp.type} operation.`;
    }
  }

  // Generate follow-up suggestions
  private generateSuggestions(operations: AgentOperation[]): string[] {
    const suggestions: string[] = [];
    const lastOp = operations[operations.length - 1];

    if (lastOp?.status === "success") {
      switch (lastOp.type) {
        case "list_files":
          suggestions.push(
            "Search for specific files",
            "Create a new folder",
            "Upload a file"
          );
          break;
        case "search_files":
          suggestions.push(
            "Open one of the files",
            "Create a new file",
            "List all files"
          );
          break;
        case "create_file":
          suggestions.push(
            "Edit the file",
            "Share the file",
            "Create another file"
          );
          break;
        case "create_folder":
          suggestions.push(
            "Add files to the folder",
            "List files in the folder",
            "Create another folder"
          );
          break;
        case "read_file":
          suggestions.push("Edit the file", "Share the file", "Create a copy");
          break;
        default:
          suggestions.push(
            "List your files",
            "Search for files",
            "Create a new file"
          );
      }
    } else {
      suggestions.push(
        "Try a different approach",
        "Check your permissions",
        "List your files"
      );
    }

    return suggestions.slice(0, 3);
  }

  // Create clarification response
  private createClarificationResponse(intent: ParsedIntent): AgentResponse {
    return {
      message: `I need some clarification: ${
        intent.clarificationQuestions?.join(". ") ||
        "Please provide more details."
      }`,
      operations: [],
      status: "partial",
      context: this.context,
      suggestions: intent.clarificationQuestions || [],
    };
  }

  // Get current context
  getContext(): AgentContext {
    return { ...this.context };
  }

  // Update context
  updateContext(updates: Partial<AgentContext>): void {
    this.context = { ...this.context, ...updates };
  }
}
