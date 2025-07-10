# Vapi Authentication Setup

This document explains how the Vapi voice agent is integrated with user authentication using Supabase access tokens.

## Overview

The Vapi voice agent now passes the user's Supabase access token in the `variableValues` when starting a call. This allows backend API routes to validate that the user is authenticated before processing Vapi function calls.

## How It Works

### 1. Frontend Session Management

The application uses a `SessionManager` class that manages Supabase authentication state:

```typescript
// Get access token from session
const { user, accessToken } = useSessionManager();
```

### 2. Vapi Workflow Integration

When starting a Vapi call, the access token is passed in the `variableValues`:

```typescript
const workflowOverrides = {
  variableValues: {
    userId: userData?.userId || "unknown",
    userName: userData?.name || "User",
    userContext: userData?.context || "google_drive_management",
    accessToken: userData?.accessToken || "", // Access token for backend auth
    timestamp: new Date().toISOString(),
    sessionSource: "voice_drive_interface",
  },
};
```

### 3. Backend Authentication Validation

Backend API routes can validate Vapi requests using the `validateVapiFunctionCall` helper:

```typescript
import { validateVapiFunctionCall } from "@/lib/vapiAuthValidator";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate the Vapi function call
  const validation = await validateVapiFunctionCall(body);

  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  // At this point, we have a valid user
  const { user, parameters } = validation;

  // Process the function call with validated user
  // ...
}
```

## Files Modified

### 1. `src/lib/vapiWorkflowManager.ts`

- Updated `UserContext` interface to include `accessToken`
- Modified `startVoiceDriveCall` to pass access token in `variableValues`
- Updated function call handler to include access token in user context

### 2. `src/lib/sessionManager.ts`

- Added `getAccessToken()` method to SessionManager class
- Updated `useSessionManager` hook to expose `accessToken`

### 3. `src/components/voice-drive/VapiVoiceAgent.tsx`

- Integrated with `useSessionManager` to get user and access token
- Updated `toggleCall` function to pass access token to Vapi workflow

### 4. `src/lib/vapiAuthValidator.ts` (New)

- Created helper functions for validating Vapi requests
- `validateVapiRequest()`: Validates access token directly
- `validateVapiFunctionCall()`: Extracts and validates token from function call

### 5. `src/app/api/vapi/example-function/route.ts` (New)

- Example API route showing how to validate Vapi function calls
- Demonstrates proper error handling and user validation

## Security Benefits

1. **User Authentication**: All Vapi function calls are validated against the user's session
2. **Token Validation**: Access tokens are verified with Supabase before processing requests
3. **User Context**: Backend can access user information (ID, email, etc.) for proper data isolation
4. **Clean Parameters**: Access token is automatically removed from function parameters

## Usage Example

When Vapi calls a backend function, the request will include:

```json
{
  "name": "create_file",
  "parameters": {
    "fileName": "example.txt",
    "content": "Hello World",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

The backend validation will:

1. Extract the access token
2. Validate it with Supabase
3. Return the authenticated user and clean parameters
4. Process the function call with proper user context

## Environment Variables Required

Make sure these environment variables are set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Testing

To test the authentication:

1. Start a Vapi call from the voice agent interface
2. Check the browser console for logs showing the access token is being passed
3. When Vapi makes function calls, the backend will validate the token
4. Check the backend logs to confirm user validation is working

## Error Handling

The system handles various error scenarios:

- Missing access token
- Invalid/expired access token
- Network errors during validation
- Malformed function call parameters

All errors are properly logged and returned to Vapi for appropriate handling.
