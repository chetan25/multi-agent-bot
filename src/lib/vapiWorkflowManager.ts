import Vapi from "@vapi-ai/web";

interface VoiceDriveConfig {
  publicApiKey: string;
  workflowId: string;
}

interface UserContext {
  userId: string;
  name?: string;
  context?: string;
  accessToken?: string;
  [key: string]: any;
}

export function createVoiceDriveWorkflow(config: VoiceDriveConfig) {
  const vapi = new Vapi(config.publicApiKey);
  let isConnected = false;
  let currentUser: UserContext | null = null;

  // Setup event listeners for voice drive calls
  vapi.on("call-start", () => {
    isConnected = true;
    console.log("Voice Drive call started");
  });

  vapi.on("call-end", () => {
    isConnected = false;
    console.log("Voice Drive call ended");
    processVoiceDriveOutcome();
  });

  vapi.on("message", (message) => {
    if (message.type === "transcript") {
      console.log(`${message.role}: ${message.transcript}`);
    } else if (message.type === "function-call") {
      handleVoiceDriveFunction(message.functionCall);
    } else if (message.type === "workflow-step") {
      console.log("Voice Drive workflow step:", message.step);
    }
  });

  vapi.on("error", (error) => {
    console.error("Voice Drive workflow error:", error);
  });

  vapi.on("speech-start", () => {
    console.log("Assistant started speaking");
  });

  vapi.on("speech-end", () => {
    console.log("Assistant finished speaking");
  });

  function handleVoiceDriveFunction(functionCall: {
    name: string;
    parameters: Record<string, unknown>;
  }) {
    // Add user context to function calls
    const functionCallWithContext = {
      ...functionCall,
      userContext: {
        userId: currentUser?.userId,
        userName: currentUser?.name,
        context: currentUser?.context,
        accessToken: currentUser?.accessToken, // Include access token in function calls
        timestamp: new Date().toISOString(),
      },
    };

    console.log("Function call with user context:", functionCallWithContext);

    switch (functionCall.name) {
      case "create_file":
        console.log(
          "Creating file:",
          functionCall.parameters,
          "for user:",
          currentUser?.userId
        );
        // TODO: Implement file creation logic with user context
        break;
      case "create_folder":
        console.log(
          "Creating folder:",
          functionCall.parameters,
          "for user:",
          currentUser?.userId
        );
        // TODO: Implement folder creation logic with user context
        break;
      case "view_file":
        console.log(
          "Viewing file:",
          functionCall.parameters,
          "for user:",
          currentUser?.userId
        );
        // TODO: Implement file viewing logic with user context
        break;
      case "search_files":
        console.log(
          "Searching files:",
          functionCall.parameters,
          "for user:",
          currentUser?.userId
        );
        // TODO: Implement file search logic with user context
        break;
      case "share_file":
        console.log(
          "Sharing file:",
          functionCall.parameters,
          "for user:",
          currentUser?.userId
        );
        // TODO: Implement file sharing logic with user context
        break;
      case "delete_file":
        console.log(
          "Deleting file:",
          functionCall.parameters,
          "for user:",
          currentUser?.userId
        );
        // TODO: Implement file deletion logic with user context
        break;
      case "upload_file":
        console.log(
          "Uploading file:",
          functionCall.parameters,
          "for user:",
          currentUser?.userId
        );
        // TODO: Implement file upload logic with user context
        break;
      default:
        console.log(
          "Voice Drive function called:",
          functionCall.name,
          functionCall.parameters,
          "for user:",
          currentUser?.userId
        );
    }
  }

  function processVoiceDriveOutcome() {
    console.log("Processing Voice Drive outcome for:", currentUser);
    // TODO: Implement outcome processing logic
    // This could include logging, analytics, or cleanup operations
  }

  return {
    startVoiceDriveCall: (userData?: UserContext) => {
      if (!isConnected) {
        currentUser = userData || null;

        // Pass user context in the start() call using workflowOverrides
        console.log(
          "🔍 VapiWorkflowManager - Starting Vapi call with user context:",
          {
            userId: userData?.userId,
            userName: userData?.name,
            context: userData?.context,
            hasAccessToken: !!userData?.accessToken,
            accessTokenLength: userData?.accessToken?.length || 0,
            accessTokenPreview: userData?.accessToken
              ? `${userData.accessToken.substring(0, 20)}...`
              : null,
            timestamp: new Date().toISOString(),
          }
        );

        // Log the workflow ID being used
        console.log("Using workflow ID:", config.workflowId);

        // Pass user context through workflowOverrides.variableValues
        const workflowOverrides = {
          variableValues: {
            userId: userData?.userId || "unknown",
            userName: userData?.name || "User",
            userContext: userData?.context || "google_drive_management",
            accessToken: userData?.accessToken || "", // Pass access token for backend authentication
            timestamp: new Date().toISOString(),
            sessionSource: "voice_drive_interface",
          },
        };

        console.log("🔍 VapiWorkflowManager - Workflow overrides being sent:", {
          ...workflowOverrides,
          variableValues: {
            ...workflowOverrides.variableValues,
            accessToken: workflowOverrides.variableValues.accessToken
              ? `${workflowOverrides.variableValues.accessToken.substring(
                  0,
                  20
                )}...`
              : null,
          },
        });

        vapi.start(
          undefined,
          undefined,
          undefined,
          config.workflowId,
          workflowOverrides
        );
      }
    },
    endCall: () => {
      if (isConnected) {
        vapi.stop();
      }
    },
    isConnected: () => isConnected,
    vapiInstance: vapi,
    getCurrentUser: () => currentUser,
  };
}

// Factory function to create a configured workflow instance
export function createConfiguredVoiceDriveWorkflow() {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!;
  const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!;

  if (!publicKey || !workflowId) {
    throw new Error(
      "Missing required Vapi configuration. Please check your environment variables."
    );
  }

  return createVoiceDriveWorkflow({
    publicApiKey: publicKey,
    workflowId: workflowId,
  });
}

// Utility function to validate Vapi configuration
export function validateVapiConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
    errors.push("NEXT_PUBLIC_VAPI_WEB_TOKEN is required");
  }

  if (!process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID) {
    errors.push("NEXT_PUBLIC_VAPI_WORKFLOW_ID is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
