import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Message,
  ToolDefinition,
} from "../types.js";

export interface OpenAIProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class OpenAICompatibleProvider {
  constructor(private readonly config: OpenAIProviderConfig) {}

  async chat(
    messages: Message[],
    tools?: ToolDefinition[],
  ): Promise<ChatCompletionResponse> {
    const body: ChatCompletionRequest = {
      model: this.config.model,
      messages,
    };
    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`provider_error: ${res.status} ${text}`);
    }

    return (await res.json()) as ChatCompletionResponse;
  }
}

export function loadProviderFromEnv(): OpenAICompatibleProvider | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new OpenAICompatibleProvider({
    apiKey,
    baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  });
}
