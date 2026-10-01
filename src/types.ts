export type Role = "system" | "user" | "assistant" | "tool";

export interface TextContent {
  type: "text";
  text: string;
}

export interface Message {
  role: Role;
  content: string | TextContent[] | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface AssistantMessage {
  role: "assistant";
  content: string | null;
  tool_calls?: ToolCall[];
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  tools?: ToolDefinition[];
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: AssistantMessage;
    finish_reason: string;
  }>;
}

export type ToolHandler = (
  args: Record<string, unknown>,
  ctx: ToolContext,
) => Promise<string>;

export interface ToolContext {
  workspaceRoot: string;
  memoryDir: string;
}

export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}
