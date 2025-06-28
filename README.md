# Multi-Modal Chatbot

A Next.js application featuring a multi-provider AI chat interface with support for OpenAI, Anthropic, and Mistral AI models.

## Features

- **Multi-Provider AI Chat**: Support for multiple AI providers including OpenAI, Anthropic, and Mistral
- **User API Key Management**: Secure local storage of API keys with provider configuration
- **Model Selection**: Choose from various models within each provider
- **Real-time Chat**: Streaming responses with typing indicators
- **Authentication**: User authentication with Supabase
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui

## Supported Providers

### OpenAI

- GPT-4o (with vision support)
- GPT-4o Mini (with vision support)
- GPT-3.5 Turbo

### Anthropic

- Claude 3.5 Sonnet (with vision support)
- Claude 3.5 Haiku (with vision support)
- Claude 3 Opus (with vision support)

### Mistral AI

- Mistral Large
- Mistral Medium
- Mistral Small

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account for authentication

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd multi-modal-chatbot
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure your environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Default API keys (users can override with their own)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
MISTRAL_API_KEY=your_mistral_api_key
```

5. Run the development server:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Setting Up AI Providers

1. Navigate to the Chat page (`/integrations/chat`)
2. Click "Configure Provider" to set up your first AI provider
3. Choose a provider (OpenAI, Anthropic, or Mistral)
4. Enter your API key for the selected provider
5. Select a model from the available options
6. Start chatting!

### Switching Between Providers

- Use the Settings panel to configure additional providers
- Switch between configured providers using the provider selector
- Each provider maintains its own API key and model selection

### API Key Security

- API keys are stored locally in the browser's localStorage
- Keys are never sent to our servers
- Each user manages their own API keys
- Keys can be updated or removed at any time

## Project Structure

```
src/
├── app/
│   ├── api/chat/          # Chat API endpoint
│   ├── integrations/      # Integration pages
│   └── ...
├── components/
│   ├── chat/             # Chat-related components
│   │   ├── ChatComponent.tsx
│   │   ├── ProviderSelector.tsx
│   │   └── ProviderConfig.tsx
│   └── ...
├── hooks/
│   ├── useChatConfig.ts  # Chat configuration management
│   └── ...
└── lib/
    ├── types.ts          # TypeScript interfaces
    └── ...
```

## Technologies Used

- **Next.js 15** - React framework
- **AI SDK** - AI provider integrations
- **Supabase** - Authentication and database
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **TypeScript** - Type safety

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
