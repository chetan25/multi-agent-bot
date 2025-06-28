export interface Provider {
  id: string;
  name: string;
  description: string;
  models: Model[];
  requiresApiKey: boolean;
  apiKeyName: string;
  logo?: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens?: number;
  supportsVision?: boolean;
  supportsFunctionCalling?: boolean;
}

export interface UserProviderConfig {
  providerId: string;
  apiKey: string;
  isConfigured: boolean;
}

export interface ChatConfig {
  selectedProvider: string;
  selectedModel: string;
  userProviders: UserProviderConfig[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded data
  url?: string; // optional URL if file is uploaded to storage
}

export interface ChatMessage {
  id: string;
  threadId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  attachments?: FileAttachment[];
  createdAt: string;
}

export interface ChatThread {
  id: string;
  userId: string;
  threadId: string; // userId + sequential count (e.g., "user123-1", "user123-2")
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface CreateThreadRequest {
  userId: string;
  title?: string;
}

export interface SaveMessageRequest {
  threadId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  attachments?: FileAttachment[];
}

export const PROVIDERS: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Powerful language models from OpenAI",
    apiKeyName: "OPENAI_API_KEY",
    requiresApiKey: true,
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        provider: "openai",
        description: "Most capable GPT-4 model",
        maxTokens: 128000,
        supportsVision: true,
        supportsFunctionCalling: true,
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "openai",
        description: "Fast and efficient GPT-4 model",
        maxTokens: 128000,
        supportsVision: true,
        supportsFunctionCalling: true,
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: "openai",
        description: "Fast and cost-effective model",
        maxTokens: 16385,
        supportsFunctionCalling: true,
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models from Anthropic",
    apiKeyName: "ANTHROPIC_API_KEY",
    requiresApiKey: true,
    models: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        provider: "anthropic",
        description: "Most capable Claude model",
        maxTokens: 200000,
        supportsVision: true,
        supportsFunctionCalling: true,
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        provider: "anthropic",
        description: "Fast and efficient Claude model",
        maxTokens: 200000,
        supportsVision: true,
        supportsFunctionCalling: true,
      },
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        provider: "anthropic",
        description: "Previous generation Claude model",
        maxTokens: 200000,
        supportsVision: true,
        supportsFunctionCalling: true,
      },
    ],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Open source models from Mistral AI",
    apiKeyName: "MISTRAL_API_KEY",
    requiresApiKey: true,
    models: [
      {
        id: "mistral-large-latest",
        name: "Mistral Large",
        provider: "mistral",
        description: "Most capable Mistral model",
        maxTokens: 32768,
        supportsFunctionCalling: true,
      },
      {
        id: "mistral-medium-latest",
        name: "Mistral Medium",
        provider: "mistral",
        description: "Balanced performance and speed",
        maxTokens: 32768,
        supportsFunctionCalling: true,
      },
      {
        id: "mistral-small-latest",
        name: "Mistral Small",
        provider: "mistral",
        description: "Fast and cost-effective model",
        maxTokens: 32768,
        supportsFunctionCalling: true,
      },
    ],
  },
];

export const getProviderById = (id: string): Provider | undefined => {
  return PROVIDERS.find((provider) => provider.id === id);
};

export const getModelById = (modelId: string): Model | undefined => {
  for (const provider of PROVIDERS) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) return model;
  }
  return undefined;
};
