# Google Drive Integration Setup

This document outlines the setup process for integrating Google Drive with the Voice Assistant application.

## Overview

The Google Drive integration allows users to:

- Connect their Google Drive account via OAuth2
- Store refresh tokens securely in a dedicated `google_tokens` table
- Manage connection status in both frontend state and database
- Disconnect and clear stored tokens

## Database Setup

### 1. Run the Migration

Execute the Google Drive migration to create the required `google_tokens` table:

```sql
-- Run the contents of google-drive-migration.sql in your Supabase SQL editor
```

This creates a new `google_tokens` table with the following structure:

- `id` - Primary key (UUID)
- `user_id` - Reference to auth.users table
- `refresh_token` - Google OAuth refresh token
- `access_token` - Cached access token (optional)
- `token_expiry` - Token expiry timestamp (optional)
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp

### 2. Security Features

The migration automatically:

- Enables Row Level Security (RLS) on the `google_tokens` table
- Creates policies to ensure users can only access their own tokens
- Adds indexes for better performance
- Sets up automatic timestamp updates

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Google Cloud Console Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name
   - User support email
   - Developer contact information
4. Add the following scopes:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/documents`
   - `https://www.googleapis.com/auth/spreadsheets`

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/google/callback` (for development)
   - `https://yourdomain.com/api/google/callback` (for production)
5. Copy the Client ID and Client Secret to your environment variables

## Frontend Components

### 1. useGoogleDrive Hook

The `useGoogleDrive` hook manages the connection state:

```typescript
const {
  isConnected,
  isConnecting,
  isChecking,
  error,
  connect,
  disconnect,
  checkConnectionStatus,
} = useGoogleDrive();
```

### 2. VoiceDriveHeader Component

The header component displays connection status and provides connect/disconnect functionality.

### 3. GoogleDriveStatus Component

A test component for verifying the connection state management.

## API Routes

### 1. `/api/google/auth-url`

Generates the Google OAuth URL with proper scopes and state parameter.

### 2. `/api/google/callback`

Handles the OAuth callback, exchanges the authorization code for tokens, and stores them in the `google_tokens` table.

## Usage Flow

### 1. Connecting to Google Drive

1. User clicks "Connect" button
2. System generates OAuth URL with user ID as state parameter
3. User is redirected to Google OAuth consent screen
4. After consent, Google redirects back to callback URL
5. System exchanges code for tokens and stores in `google_tokens` table
6. User is redirected back to Voice Drive page with success status
7. Frontend updates connection state

### 2. Disconnecting from Google Drive

1. User clicks "Disconnect" button
2. System deletes the user's record from `google_tokens` table
3. Frontend updates connection state to disconnected

### 3. Checking Connection Status

1. On page load, system checks if user has a record in `google_tokens` table
2. Connection status is displayed in the UI
3. State is synchronized between frontend and database

## Security Considerations

1. **Token Storage**: Refresh tokens are stored securely in a dedicated table with RLS policies
2. **State Parameter**: User ID is passed as state parameter to prevent CSRF attacks
3. **Error Handling**: Proper error handling and user feedback for failed operations
4. **Token Cleanup**: Tokens are properly deleted on disconnect
5. **Row Level Security**: Users can only access their own tokens

## Database Schema

The `google_tokens` table structure:

```sql
CREATE TABLE google_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    access_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
```

## Testing

1. Run the migration in Supabase
2. Set up environment variables
3. Configure Google OAuth credentials
4. Test the connection flow:
   - Connect to Google Drive
   - Verify connection status
   - Disconnect and verify cleanup
   - Check error handling

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Ensure the redirect URI in Google Console matches your callback URL
2. **"Missing code or state parameter"**: Check that the OAuth flow is properly configured
3. **"Failed to save token"**: Verify Supabase permissions and RLS policies
4. **"User not authenticated"**: Ensure user is logged in before attempting connection

### Debug Steps

1. Check browser console for errors
2. Verify environment variables are set correctly
3. Check Supabase logs for database errors
4. Verify Google OAuth configuration
5. Test with the GoogleDriveStatus component
6. Check the `google_tokens` table in Supabase dashboard
