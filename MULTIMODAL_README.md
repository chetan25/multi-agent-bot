# Multimodal Functionality Implementation

This document describes the multimodal functionality implemented in the chatbot application, including image upload/analysis and image generation capabilities.

## Features

### 1. Image Analysis (Vision)

- **Upload Images**: Users can upload images to analyze with AI models
- **Supabase Storage**: Images are stored in Supabase storage and referenced by URLs
- **Vision Models**: Support for GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet, Claude 3.5 Haiku, and Claude 3 Opus
- **Image Validation**: Automatic validation of image file types and sizes (max 20MB)
- **User Authentication**: Images are stored in user-specific folders for security

### 2. Image Generation

- **DALL-E Models**: Support for DALL-E 3 and DALL-E 2
- **Customizable Options**: Size, quality, style, and count options
- **Download & Copy**: Generated images can be downloaded or URLs copied
- **Error Handling**: Comprehensive error handling and validation

## Architecture

### Image Storage Flow

1. **Upload**: User selects images → Upload to Supabase storage → Get public URLs
2. **Chat**: Send image URLs to LLM → LLM analyzes images → Return response
3. **Storage**: Images stored in `chat-images` bucket with user-specific folders
4. **Database**: Image URLs stored in `chat_messages.attachments` JSONB field

### Security

- **Row Level Security**: Users can only access their own images
- **User Isolation**: Images stored in `{userId}/` folders
- **File Validation**: Type and size validation before upload
- **Authentication Required**: Users must be signed in to upload images

## API Endpoints

### 1. Chat API (`/api/chat`)

Handles chat messages with optional image attachments using URLs.

**Request:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's in this image?"
    }
  ],
  "provider": "openai",
  "model": "gpt-4o",
  "userApiKey": "sk-...",
  "attachments": [
    {
      "id": "123",
      "name": "image.jpg",
      "type": "image/jpeg",
      "size": 1024000,
      "url": "https://supabase.co/storage/v1/object/public/chat-images/user123/image.jpg",
      "mimeType": "image/jpeg"
    }
  ]
}
```

**Response:** Streaming text response from the AI model.

### 2. Image Generation API (`/api/image-generation`)

Handles image generation requests.

**Request:**

```json
{
  "prompt": "A beautiful sunset over mountains",
  "provider": "openai",
  "model": "dall-e-3",
  "userApiKey": "sk-...",
  "options": {
    "size": "1024x1024",
    "quality": "standard",
    "style": "vivid",
    "n": 1
  }
}
```

**Response:**

```json
{
  "images": [
    {
      "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
      "revisedPrompt": "A beautiful sunset over mountains with vibrant colors"
    }
  ]
}
```

## Components

### 1. ImageUploadService (`src/lib/imageUploadService.ts`)

- **Supabase Integration**: Handles file uploads to Supabase storage
- **URL Generation**: Creates public URLs for uploaded images
- **File Validation**: Validates file types and sizes
- **User Security**: Organizes files by user ID

### 2. FileUpload Component

- **Drag and Drop**: Modern file upload interface
- **Progress Indication**: Shows upload progress
- **Error Handling**: Comprehensive error messages
- **Authentication Check**: Requires user sign-in

### 3. ImageGenerationComponent

- **Prompt Input**: Text input for image generation
- **Model Options**: DALL-E 3 and DALL-E 2 specific options
- **Image Display**: Shows generated images with download options
- **Error Handling**: User-friendly error messages

### 4. FileDisplay Component

- **URL Support**: Displays images from URLs or base64
- **Compact Mode**: Inline display for chat messages
- **Download/View**: Actions for file interaction
- **Fallback Handling**: Graceful handling of missing images

## Database Schema

### Storage Bucket

```sql
-- chat-images bucket
- Public access enabled
- 20MB file size limit
- Image MIME types only
- User-specific folders: {userId}/{filename}
```

### Chat Messages

```sql
-- chat_messages table
attachments JSONB -- Stores image URLs and metadata
```

## Setup Instructions

### 1. Supabase Storage Setup

Run the storage setup SQL in your Supabase dashboard:

```sql
-- Execute supabase-storage-setup.sql
```

### 2. Environment Variables

Ensure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Storage Bucket

Create the `chat-images` bucket in Supabase:

- Go to Storage in Supabase dashboard
- Create bucket named `chat-images`
- Set as public
- Configure RLS policies

## Usage Examples

### Image Analysis

1. **Sign in** to your account
2. **Select** a vision-capable model (GPT-4o, Claude 3.5)
3. **Upload images** using the file upload component
4. **Ask questions** about the images in the chat
5. **Receive AI analysis** of the image content

### Image Generation

1. **Switch to image generation mode** using the toggle
2. **Enter a detailed prompt** describing the desired image
3. **Adjust generation options** (size, quality, style)
4. **Generate images** and download or copy URLs

## Model Support

### Vision Models (Image Analysis)

- **OpenAI**: GPT-4o, GPT-4o Mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus

### Image Generation Models

- **OpenAI**: DALL-E 3, DALL-E 2

## Error Handling

### Common Errors

1. **Authentication Required**: User must be signed in to upload images
2. **Invalid File Type**: Only image files are supported
3. **File Too Large**: Images must be under 20MB
4. **Storage Quota**: Check Supabase storage limits
5. **Network Issues**: Handle upload failures gracefully

### Validation

- Image file type validation (JPEG, PNG, GIF, WebP, etc.)
- File size limits (20MB max per image)
- User authentication check
- Model capability verification
- Storage bucket availability

## Security Considerations

1. **User Isolation**: Images stored in user-specific folders
2. **RLS Policies**: Row-level security on storage objects
3. **File Validation**: Server-side validation of uploads
4. **Authentication**: Required for all file operations
5. **URL Security**: Public URLs with user-specific paths

## Performance Considerations

1. **URL-based Loading**: Images loaded from URLs, not base64
2. **CDN Benefits**: Supabase storage provides global CDN
3. **Reduced Payload**: No base64 encoding overhead
4. **Caching**: Browser caching of image URLs
5. **Scalability**: Efficient storage and retrieval

## Future Enhancements

1. **Image Compression**: Automatic compression before upload
2. **Batch Processing**: Multiple image uploads
3. **Image Editing**: Basic editing capabilities
4. **Storage Management**: User storage quota and cleanup
5. **Advanced Formats**: Support for more image formats

## Testing

### Manual Testing

1. **Upload Images**: Test various image types and sizes
2. **Chat Integration**: Verify images appear in chat history
3. **Image Generation**: Test DALL-E models with different prompts
4. **Error Scenarios**: Test invalid files and network issues
5. **Authentication**: Test with signed-in and anonymous users

### Storage Testing

1. **Upload Limits**: Test file size and type restrictions
2. **User Isolation**: Verify users can't access others' images
3. **URL Access**: Test public URL accessibility
4. **Cleanup**: Test image deletion functionality

## Troubleshooting

### Image Upload Issues

1. **Check Authentication**: Ensure user is signed in
2. **Verify File Type**: Only image files are supported
3. **Check File Size**: Must be under 20MB
4. **Storage Bucket**: Verify `chat-images` bucket exists
5. **RLS Policies**: Check storage policies are configured

### Image Display Issues

1. **URL Validity**: Check image URLs are accessible
2. **CORS Issues**: Verify Supabase CORS settings
3. **Network Access**: Check internet connectivity
4. **Browser Cache**: Clear cache if images don't update

### Chat Integration Issues

1. **Message Storage**: Check attachments are saved in database
2. **URL Format**: Verify URLs are properly formatted
3. **Model Support**: Ensure vision-capable model is selected
4. **API Response**: Check chat API handles image URLs correctly
