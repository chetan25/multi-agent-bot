# Multi-Modal Chat Functionality

This application now supports multi-modal chat, allowing users to send images and files along with text messages to AI models that support vision capabilities.

## Features

### File Upload Support

- **Drag & Drop**: Users can drag and drop files directly into the chat interface
- **File Selection**: Click the upload area or use the file picker to select files
- **Multiple Files**: Support for uploading up to 5 files simultaneously
- **File Types**:
  - Images (JPEG, PNG, GIF, WebP, etc.)
  - Text files (TXT, MD, etc.)
  - PDF documents
- **File Size Limit**: Maximum 10MB per file

### Vision-Enabled Models

The following models support multi-modal functionality:

#### OpenAI

- **GPT-4o**: Full vision support for images and files
- **GPT-4o Mini**: Full vision support for images and files

#### Anthropic

- **Claude 3.5 Sonnet**: Full vision support for images and files
- **Claude 3.5 Haiku**: Full vision support for images and files
- **Claude 3 Opus**: Full vision support for images and files

#### Mistral

- **Mistral Large**: Text-only (no vision support)
- **Mistral Medium**: Text-only (no vision support)
- **Mistral Small**: Text-only (no vision support)

## How to Use

### 1. Configure a Vision-Enabled Model

1. Go to the chat interface
2. Click "Settings" to open the provider configuration
3. Select a provider (OpenAI or Anthropic recommended)
4. Choose a vision-enabled model (marked with "Vision Enabled" badge)
5. Enter your API key and save the configuration

### 2. Upload Files

1. Click the paperclip icon (📎) next to the chat input
2. Either:
   - Drag and drop files into the upload area
   - Click the upload area to open the file picker
3. Select your files (up to 5 files, 10MB each)
4. Review the selected files in the preview area
5. Remove any unwanted files using the X button

### 3. Send Messages with Files

1. Type your message (optional - you can send files without text)
2. Attach files using the upload interface
3. Click the send button or press Enter
4. The AI will process both your text and the attached files

### 4. View File Attachments

- **Images**: Click the "View" button to open images in a new tab
- **Other Files**: Click the "Download" button to download files
- **In Messages**: File attachments are displayed with file icons and names

## Technical Implementation

### Frontend Components

- `FileUpload.tsx`: Handles file selection, validation, and preview
- `FileDisplay.tsx`: Displays file attachments in messages
- `ChatComponent.tsx`: Main chat interface with file upload integration

### Backend API

- `route.ts`: Updated to handle file attachments in chat requests
- Converts file attachments to AI SDK format
- Supports both image and text file processing

### File Processing

1. **Client-side**: Files are converted to base64 and stored in memory
2. **API Request**: File data is sent along with the message to the backend
3. **AI Processing**: Backend converts files to the appropriate format for the AI model
4. **Response**: AI processes both text and file content together

## File Format Support

### Images

- **Formats**: JPEG, PNG, GIF, WebP, BMP, TIFF
- **Processing**: Sent as base64-encoded data URLs
- **AI Models**: Can analyze, describe, and answer questions about images

### Text Files

- **Formats**: TXT, MD, JSON, CSV, etc.
- **Processing**: Content is extracted and sent as text
- **AI Models**: Can read and analyze text file content

### PDF Files

- **Processing**: Currently sent as file metadata (future enhancement for content extraction)
- **AI Models**: Can recognize PDF files but may not extract content yet

## Limitations

1. **File Size**: Maximum 10MB per file
2. **File Count**: Maximum 5 files per message
3. **Model Support**: Only vision-enabled models can process images
4. **PDF Content**: PDF content extraction is not yet implemented
5. **File Persistence**: Files are not stored permanently, only in memory during the session

## Future Enhancements

1. **PDF Content Extraction**: Implement PDF text extraction for better AI processing
2. **File Storage**: Add persistent file storage for longer conversations
3. **More File Types**: Support for additional file formats
4. **File Compression**: Automatic image compression for better performance
5. **Batch Processing**: Improved handling of multiple large files

## Testing

To test the multi-modal functionality:

1. Navigate to `/test-multimodal` for a dedicated test page
2. Configure a vision-enabled model (GPT-4o or Claude 3.5 Sonnet)
3. Upload various file types and test the AI's responses
4. Try different combinations of text and files

## Troubleshooting

### Common Issues

1. **"Vision Enabled" badge not showing**

   - Make sure you've selected a vision-enabled model
   - Check that the model supports vision in the types configuration

2. **File upload not working**

   - Check file size (must be under 10MB)
   - Verify file type is supported
   - Ensure you're using a vision-enabled model

3. **AI not responding to images**

   - Confirm you're using a vision-enabled model
   - Check that the image format is supported
   - Verify the API key is valid and has sufficient credits

4. **Files not displaying in chat**
   - Files are only shown in the current session
   - Historical messages don't retain file attachments
   - Check browser console for any JavaScript errors
