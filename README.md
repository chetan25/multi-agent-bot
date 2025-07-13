---
title: "Multi-Agent Bot - Voice & AI Chat Assistant"
excerpt: "A comprehensive Next.js application featuring a multi-provider AI chat interface with voice capabilities, Google Drive integration, and multimodal support. This application combines text-based AI chat with voice interaction and file management capabilities."
tech: "Next.js, React, TypeScript, Supabase, Google Drive API, Vapi, OpenAI, Anthropic, Mistral, Tailwind CSS"
---

# Multi-Agent Bot - Voice & AI Chat Assistant

A comprehensive Next.js application featuring a multi-provider AI chat interface with voice capabilities, Google Drive integration, and multimodal support. This application combines text-based AI chat with voice interaction and file management capabilities.

## 🚀 Features

### Core AI Chat

- **Multi-Provider AI Chat**: Support for OpenAI, Anthropic, and Mistral AI models
- **User API Key Management**: Secure local storage of API keys with provider configuration
- **Model Selection**: Choose from various models within each provider
- **Real-time Chat**: Streaming responses with typing indicators
- **Chat History**: Persistent chat threads with automatic thread management

### Voice Integration

- **Voice Assistant**: Vapi-powered voice interaction for Google Drive management
- **Voice Commands**: Create, view, search, and manage Google Drive files via voice
- **Real-time Transcription**: Live voice-to-text and text-to-speech
- **Voice Workflow Management**: Configurable voice workflows with user context

### Google Drive Integration

- **OAuth2 Authentication**: Secure Google Drive connection
- **File Management**: Upload, download, create, and manage files
- **Voice-Controlled Operations**: Use voice commands to interact with Google Drive
- **File Sharing**: Share files with others through voice commands
- **Search Capabilities**: Search for files and folders using natural language

### Multimodal Features

- **Image Analysis**: Upload and analyze images with AI vision models
- **Image Generation**: Generate images using DALL-E models
- **File Upload**: Drag-and-drop file upload with progress indication
- **Supabase Storage**: Secure file storage with user isolation

### Authentication & Security

- **Supabase Authentication**: User authentication and session management
- **Row Level Security**: Secure data access with RLS policies
- **HTTPS Development**: Local HTTPS setup for secure development
- **Token Management**: Secure OAuth token storage and refresh

## 🛠️ Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account for authentication and storage
- Google Cloud Console account for OAuth credentials
- Vapi account for voice features

## 📦 Installation

1. **Clone the repository**:

```bash
git clone <repository-url>
cd multi-modal-chatbot
```

2. **Install dependencies**:

```bash
pnpm install
```

3. **Set up environment variables**:

```bash
cp .env.example .env.local
```

## ⚙️ Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Vapi Configuration (for voice features)
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token
NEXT_PUBLIC_VAPI_WORKFLOW_ID=your_vapi_workflow_id
VAPI_API_KEY=your_vapi_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Default API keys (users can override with their own)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
MISTRAL_API_KEY=your_mistral_api_key
```

## 🔧 Setup Instructions

### 1. Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your project credentials** from Settings > API
3. **Run the database migrations**:

```sql
-- Run supabase-migration.sql for chat history
-- Run google-drive-migration.sql for Google Drive integration
-- Run supabase-storage-setup.sql for file storage
```

4. **Set up storage buckets**:
   - Create `chat-images` bucket for image uploads
   - Configure RLS policies for user isolation

### 2. Google OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable APIs**:

   - Google Drive API
   - Google Docs API
   - Google Sheets API

4. **Configure OAuth Consent Screen**:

   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Add required scopes:
     - `https://www.googleapis.com/auth/drive`
     - `https://www.googleapis.com/auth/documents`
     - `https://www.googleapis.com/auth/spreadsheets`

5. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/google/callback` (development)
     - `https://yourdomain.com/api/google/callback` (production)

### 3. Vapi Setup

1. **Create a Vapi account** at [vapi.ai](https://vapi.ai)
2. **Create a workflow** for Google Drive management
3. **Configure voice functions**:

   - `create_file` - Create new files
   - `create_folder` - Create new folders
   - `view_file` - View file contents
   - `search_files` - Search for files
   - `share_file` - Share files with others
   - `delete_file` - Delete files
   - `upload_file` - Upload files

4. **Get your credentials**:
   - Web token for frontend
   - API key for backend
   - Workflow ID for voice operations

### 4. HTTPS Development Setup (Optional but Recommended)

For OAuth and voice features, HTTPS is recommended:

```bash
# Option 1: Built-in HTTPS
pnpm dev:https

# Option 2: Custom certificates (more secure)
pnpm setup:https
pnpm dev
```

## 🚀 Running the Application

1. **Start the development server**:

```bash
pnpm dev
```

2. **Open your browser** to [http://localhost:3000](http://localhost:3000)

3. **Sign up/Sign in** using Supabase authentication

## 📱 Usage Guide

### AI Chat Interface

1. **Navigate to** `/integrations/chat`
2. **Configure AI providers** by clicking "Configure Provider"
3. **Enter your API keys** for OpenAI, Anthropic, or Mistral
4. **Select models** and start chatting
5. **Upload images** for vision analysis
6. **Generate images** using DALL-E models

### Voice & Google Drive Integration

1. **Navigate to** `/integrations/voice-drive`
2. **Connect to Google Drive** using the "Connect" button
3. **Complete OAuth flow** to authorize access
4. **Start voice interaction** by clicking the voice button
5. **Use voice commands** like:
   - "Create a new folder called Work"
   - "Show me my recent files"
   - "Search for documents about projects"
   - "Share the file with john@example.com"

### Chat History Management

- **Automatic thread creation** when you first chat
- **New conversations** create sequential threads
- **Thread management** via the hamburger menu
- **Edit thread titles** and delete old conversations

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── ai/                # AI chat endpoints
│   │   ├── chat/              # Chat history endpoints
│   │   ├── drive/             # Google Drive endpoints
│   │   ├── google/            # OAuth endpoints
│   │   ├── image-generation/  # Image generation
│   │   └── vapi/              # Voice agent endpoints
│   ├── integrations/          # Feature pages
│   │   ├── chat/              # AI chat interface
│   │   └── voice-drive/       # Voice & Drive integration
│   └── ...
├── components/
│   ├── chat/                  # Chat components
│   ├── voice-drive/           # Voice & Drive components
│   └── ui/                    # UI components
├── lib/
│   ├── stores/                # Zustand state management
│   ├── googleDriveService.ts  # Google Drive operations
│   ├── vapiWorkflowManager.ts # Voice workflow management
│   └── ...
└── ...
```

## 🔧 API Endpoints

### Chat & AI

- `POST /api/chat` - Send chat messages with AI
- `POST /api/ai` - Direct AI interactions
- `POST /api/image-generation` - Generate images

### Google Drive

- `GET /api/google/auth-url` - Get OAuth URL
- `GET /api/google/callback` - OAuth callback handler
- `GET /api/drive/list` - List Drive files
- `POST /api/drive/upload` - Upload files
- `GET /api/drive/file/[fileId]` - Get file details

### Voice Integration

- `POST /api/vapi/agent` - Voice agent operations
- `POST /api/vapi/create-file` - Create files via voice
- `POST /api/vapi/search-files` - Search files via voice

## 🛡️ Security Features

- **Row Level Security (RLS)** on all database tables
- **User authentication** required for all features
- **OAuth2 token management** with secure storage
- **HTTPS enforcement** for development and production
- **API key isolation** - users manage their own keys
- **File access control** - users can only access their own files

## 🚨 Troubleshooting

### Common Issues

1. **OAuth Redirect Errors**:

   - Verify redirect URIs in Google Console
   - Ensure HTTPS is properly configured
   - Check environment variables

2. **Voice Not Working**:

   - Verify Vapi credentials
   - Check workflow configuration
   - Ensure microphone permissions

3. **File Upload Issues**:

   - Check Supabase storage setup
   - Verify RLS policies
   - Check file size limits (20MB)

4. **Chat History Problems**:
   - Run database migrations
   - Check user authentication
   - Verify RLS policies

### Debug Mode

Enable console logging for debugging:

- Check browser console for errors
- Verify environment variables
- Test API endpoints directly
- Check Supabase logs

## 🔄 Development Scripts

```bash
pnpm dev              # Start development server
pnpm dev:https        # Start with HTTPS
pnpm setup:https      # Generate HTTPS certificates
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

## 📚 Additional Documentation

- [Google Drive Setup](./GOOGLE_DRIVE_SETUP.md) - Detailed Google Drive integration
- [Vapi Workflow Update](./VAPI_WORKFLOW_UPDATE.md) - Voice integration details
- [Multimodal Features](./MULTIMODAL_README.md) - Image analysis and generation
- [Chat History Setup](./CHAT_HISTORY_SETUP.md) - Chat persistence
- [HTTPS Development](./HTTPS_DEVELOPMENT_SETUP.md) - Local HTTPS setup
- [Environment Setup](./ENVIRONMENT_SETUP.md) - Environment configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the additional documentation
3. Check browser console for errors
4. Verify all environment variables are set correctly
