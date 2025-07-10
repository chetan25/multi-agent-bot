# OAuth Configuration Guide

This guide helps you configure Google OAuth to work with your Next.js application.

## 🔧 **Google OAuth Console Setup**

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**

### Step 2: Configure OAuth 2.0 Client

1. Find your OAuth 2.0 Client ID
2. Click on it to edit
3. Go to the **Authorized redirect URIs** section

### Step 3: Add Redirect URIs

Add these redirect URIs to your Google OAuth console:

#### **For Development (HTTP)**

```
http://localhost:3000/api/google/callback
```

#### **For Development (HTTPS)**

```
https://localhost:3000/api/google/callback
```

#### **For Production**

```
https://yourdomain.com/api/google/callback
```

## 🌐 **Environment Variables**

Create a `.env.local` file in your project root with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# App URL Configuration
# For HTTP development:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For HTTPS development:
# NEXT_PUBLIC_APP_URL=https://localhost:3000

# For production:
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🔍 **Debugging OAuth URLs**

### Check Generated URLs

Visit this endpoint to see what URLs are being generated:

```
http://localhost:3000/api/debug/oauth-urls
```

This will show you:

- The OAuth callback URL being used
- The base URL configuration
- Environment variables
- HTTPS configuration

### Common Issues

#### **1. redirect_uri_mismatch Error**

**Cause**: The redirect URI in your OAuth request doesn't match what's in Google Console.

**Solution**:

- Check the debug endpoint above
- Add the exact URL to Google OAuth console
- Make sure protocol (http/https) matches

#### **2. Wrong Port Number**

**Cause**: Using a different port than configured.

**Solution**:

- Check what port your app is running on
- Update `NEXT_PUBLIC_APP_URL` to include the correct port
- Add the correct URL to Google OAuth console

#### **3. Protocol Mismatch**

**Cause**: Using HTTP when HTTPS is configured or vice versa.

**Solution**:

- Check if you're running with HTTPS (`npm run dev:https`)
- Update `NEXT_PUBLIC_APP_URL` accordingly
- Add both HTTP and HTTPS URLs to Google OAuth console

## 🚀 **Testing OAuth**

### Step 1: Start Your Server

```bash
# For HTTP
npm run dev

# For HTTPS
npm run dev:https
```

### Step 2: Check URLs

Visit: `http://localhost:3000/api/debug/oauth-urls`

### Step 3: Test OAuth Flow

1. Go to your app
2. Try to connect Google Drive
3. Check console logs for OAuth URLs
4. Verify the callback URL matches what's in Google Console

## 📋 **Checklist**

- [ ] Google OAuth Client ID configured
- [ ] Google OAuth Client Secret configured
- [ ] Redirect URIs added to Google Console
- [ ] Environment variables set correctly
- [ ] App running on expected port
- [ ] Protocol (HTTP/HTTPS) matches configuration
- [ ] Debug endpoint shows correct URLs

## 🔗 **Useful Links**

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
