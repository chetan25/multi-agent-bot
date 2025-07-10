# Vapi Workflow Update

This document explains the recent update to the Vapi implementation to use `workflowId` instead of `assistantId`, following the new Vapi SDK pattern.

## Changes Made

### 1. Environment Variables

- **Before**: `NEXT_PUBLIC_VAPI_ASSISTANT_ID`
- **After**: `NEXT_PUBLIC_VAPI_WORKFLOW_ID`

Update your `.env.local` file:

```env
# Vapi Configuration (for voice features)
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token_here
NEXT_PUBLIC_VAPI_WORKFLOW_ID=your_vapi_workflow_id_here
VAPI_API_KEY=your_vapi_api_key_here
```

### 2. New Workflow Manager

Created `src/lib/vapiWorkflowManager.ts` to centralize Vapi workflow management:

```typescript
import {
  createConfiguredVoiceDriveWorkflow,
  validateVapiConfig,
} from "@/lib/vapiWorkflowManager";

// Validate configuration
const configValidation = validateVapiConfig();
if (!configValidation.isValid) {
  console.error("Configuration errors:", configValidation.errors);
}

// Create workflow instance
const voiceDriveWorkflow = createConfiguredVoiceDriveWorkflow();
```

### 3. Updated Component Structure

The `VapiVoiceAgent` component now uses the new workflow pattern:

```typescript
// Initialize workflow
const voiceDriveWorkflow = createConfiguredVoiceDriveWorkflow();

// Start call with user context
voiceDriveWorkflow.startVoiceDriveCall({
  userId: userId,
  name: `User-${userId.substring(0, 8)}`, // Creates readable name from user ID
  context: "google_drive_management",
});

// End call
voiceDriveWorkflow.endCall();
```

### 4. User Context Integration

User context is now automatically passed to Vapi through `workflowOverrides.variableValues` and available in function calls:

```typescript
// User context is passed through workflowOverrides:
vapi.start(undefined, undefined, undefined, workflowId, {
  variableValues: {
    userId: "user-uuid-here",
    userName: "User-12345678", // Generated from user ID
    userContext: "google_drive_management",
    timestamp: "2024-01-01T12:00:00.000Z",
    sessionSource: "voice_drive_interface",
  },
});

// This context is available in all function calls:
function handleVoiceDriveFunction(functionCall) {
  console.log("Function call for user:", currentUser?.userId);
  console.log("User name:", currentUser?.name);
  // Process function with user context
}
```

### 5. Workflow Variable Usage

The user context variables can be used in your Vapi workflow templates using LiquidJS syntax:

```liquid
Hello {{ userName }}, I can help you with your Google Drive files.
Your user ID is {{ userId }} and you're in {{ userContext }} mode.
Session started at {{ timestamp }}.
```

## New Pattern Benefits

### 1. Modular Design

- Workflow logic is separated from UI components
- Reusable across different components
- Easier to test and maintain

### 2. Better Error Handling

- Configuration validation before initialization
- Proper try-catch blocks for error handling
- User-friendly error messages

### 3. Enhanced Function Support

The workflow now supports these Google Drive functions:

- `create_file` - Create new files
- `create_folder` - Create new folders
- `view_file` - View file contents
- `search_files` - Search for files
- `share_file` - Share files with others
- `delete_file` - Delete files
- `upload_file` - Upload files

### 4. Improved Event Handling

- `call-start` - When voice call begins
- `call-end` - When voice call ends
- `message` - Handle transcripts and function calls
- `workflow-step` - Track workflow progress
- `error` - Handle errors gracefully

## Usage Examples

### Basic Usage

```typescript
import { createConfiguredVoiceDriveWorkflow } from "@/lib/vapiWorkflowManager";

const workflow = createConfiguredVoiceDriveWorkflow();

// Start a voice call
workflow.startVoiceDriveCall({
  userId: "user123",
  name: "John Doe",
  context: "google_drive_management",
});

// End the call
workflow.endCall();
```

### With Event Listeners

```typescript
const workflow = createConfiguredVoiceDriveWorkflow();
const vapiInstance = workflow.vapiInstance;

vapiInstance.on("call-start", () => {
  console.log("Voice call started");
});

vapiInstance.on("message", (message) => {
  if (message.type === "function-call") {
    console.log("Function called:", message.functionCall);
  }
});
```

### Component Integration

```typescript
import { VoiceDriveExample } from "@/components/voice-drive";

// Use the example component
<VoiceDriveExample />;
```

## Migration Guide

### For Existing Users

1. Update your environment variables
2. Replace `NEXT_PUBLIC_VAPI_ASSISTANT_ID` with `NEXT_PUBLIC_VAPI_WORKFLOW_ID`
3. Update any custom Vapi implementations to use the new workflow manager

### For New Users

1. Set up your Vapi account and get your workflow ID
2. Configure environment variables
3. Use the `createConfiguredVoiceDriveWorkflow()` function
4. Follow the example patterns in the documentation

## Troubleshooting

### Common Issues

1. **Configuration Errors**

   - Ensure all required environment variables are set
   - Use `validateVapiConfig()` to check configuration

2. **Workflow Not Starting**

   - Check that your workflow ID is correct
   - Verify your Vapi API key has proper permissions

3. **Function Calls Not Working**
   - Ensure your workflow is configured with the correct functions
   - Check the browser console for error messages

### Debug Mode

Enable debug logging by checking the browser console for detailed information about:

- Workflow initialization
- Function calls
- Error messages
- Event handling

## Next Steps

1. **Custom Functions**: Add your own custom functions to the workflow
2. **Analytics**: Implement call analytics and usage tracking
3. **Multi-language**: Add support for multiple languages
4. **Advanced Features**: Implement advanced features like call recording and transcription

## Support

For issues or questions:

1. Check the browser console for error messages
2. Verify your Vapi configuration
3. Review the example components for reference
4. Check the Vapi documentation for API updates
