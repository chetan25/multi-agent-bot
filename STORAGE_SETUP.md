# Supabase Storage Setup

To fix the "Bucket not found" error when uploading images, you need to create the storage bucket in your Supabase project.

## Option 1: Manual Setup (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **Create a new bucket**
5. Configure the bucket:
   - **Name**: `chat-images`
   - **Public**: ❌ No (unchecked) - Keep private for security
   - **File size limit**: `20MB`
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/bmp`, `image/tiff`
6. Click **Create bucket**

## Option 2: SQL Script

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase-storage-setup.sql`
5. Run the query

## Option 3: Automated Script

If you have your Supabase service role key, you can run the automated setup:

```bash
# Set your environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the setup script
node setup-storage.js
```

## Security Notes

- The bucket is **private** by default for security
- Users can only access their own images through authenticated requests
- Images are stored in user-specific folders: `{userId}/{filename}`
- Row Level Security (RLS) policies ensure users can only access their own files

## Verify Setup

After creating the bucket, you should be able to:

1. Upload images in the chat interface (when authenticated)
2. See images displayed in messages
3. Generate images with DALL-E models

## Troubleshooting

If you still get "Bucket not found" errors:

1. Make sure the bucket name is exactly `chat-images` (case-sensitive)
2. Verify the bucket is **private** (not public)
3. Check that your Supabase URL and keys are correct
4. Ensure you're authenticated when uploading images
5. Verify RLS policies are properly set up
