# Environment Variables Setup Guide

This guide will help you set up the required environment variables to fix the Google OAuth error.

## Quick Fix

Create a `.env.local` file in the root of your project with the following content:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Vapi Configuration (for voice features)
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token_here
NEXT_PUBLIC_VAPI_WORKFLOW_ID=your_vapi_workflow_id_here
VAPI_API_KEY=your_vapi_api_key_here
```

## Step-by-Step Setup

### 1. Google OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable the Google Drive API**:

   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**:

   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in required information:
     - App name: "Voice Assistant for Google Drive"
     - User support email: your email
     - Developer contact information: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/drive`
     - `https://www.googleapis.com/auth/documents`
     - `https://www.googleapis.com/auth/spreadsheets`

5. **Create OAuth 2.0 Credentials**:

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/google/callback` (for development)
     - `https://yourdomain.com/api/google/callback` (for production)
   - Copy the Client ID and Client Secret

6. **Add to .env.local**:
   ```env
   GOOGLE_CLIENT_ID=your_copied_client_id
   GOOGLE_CLIENT_SECRET=your_copied_client_secret
   ```

### 2. Supabase Setup

1. **Go to Supabase**: https://supabase.com/
2. **Create a new project** or use existing one
3. **Get your project credentials**:

   - Go to Settings > API
   - Copy the following:
     - Project URL
     - anon/public key
     - service_role key

4. **Add to .env.local**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 3. App Configuration

Add the app URL:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

Run the Google Drive migration in your Supabase SQL editor:

```sql
-- Copy the contents of google-drive-migration.sql and run it
```

## Testing the Setup

1. **Restart your development server**:

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. **Test the OAuth endpoint**:

   - Go to: `http://localhost:3000/api/google/auth-url?userId=test`
   - You should see a JSON response with a URL or an error message

3. **Check the console** for any error messages

## Common Issues

### "Missing GOOGLE_CLIENT_ID"

- Make sure you've created the OAuth credentials in Google Cloud Console
- Verify the Client ID is correctly copied to `.env.local`
- Restart your development server after adding environment variables

### "Missing GOOGLE_CLIENT_SECRET"

- Make sure you've copied the Client Secret (not just the Client ID)
- The Client Secret is hidden by default in Google Cloud Console - click "Show" to reveal it

### "Missing NEXT_PUBLIC_APP_URL"

- Set this to your development URL: `http://localhost:3000`
- For production, use your actual domain

### Redirect URI Mismatch

- Make sure the redirect URI in Google Cloud Console matches exactly: `http://localhost:3000/api/google/callback`
- Check for trailing slashes or typos

## Security Notes

- Never commit `.env.local` to version control
- Use different OAuth credentials for development and production
- Keep your service role key secure - it has admin privileges

## Next Steps

After setting up the environment variables:

1. Restart your development server
2. Navigate to `/integrations/voice-drive`
3. Click the "Connect" button
4. Complete the Google OAuth flow
5. You should see "Connected to Google Drive" status
