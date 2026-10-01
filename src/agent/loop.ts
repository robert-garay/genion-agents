import type { OpenAICompatibleProvider } from "../provider/openai.js";
import type { ToolRegistry } from "../tools/registry.js";
import type { Message, ToolContext } from "../types.js";

export interface AgentLoopOptions {
  provider: OpenAICompatibleProvider;
  tools: ToolRegistry;
  toolContext: ToolContext;
  systemPrompt?: string;
  maxTurns?: number;
}

export interface AgentRunResult {
  messages: Message[];
  finalText: string;
}

export async function runAgentTurn(
  userText: string,
  history: Message[],
  options: AgentLoopOptions,
): Promise<AgentRunResult> {
  const {
    provider,
    tools,
    toolContext,
    systemPrompt = "You are a helpful agent. Use tools when they help answer accurately.",
    maxTurns = 8,
  } = options;

  const messages: Message[] = [...history];
  if (messages.length === 0 || messages[0]?.role !== "system") {
    messages.unshift({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: userText });

  const toolDefs = tools.definitions();

  for (let turn = 0; turn < maxTurns; turn++) {
    const completion = await provider.chat(messages, toolDefs);
    const choice = completion.choices[0];
    if (!choice) {
      throw new Error("provider_empty_response");
    }

    const assistant = choice.message;
    messages.push({
      role: "assistant",
      content: assistant.content ?? "",
      ...(assistant.tool_calls ? { tool_calls: assistant.tool_calls } : {}),
    } as Message);

    const toolCalls = assistant.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return {
        messages,
        finalText: assistant.content ?? "",
      };
    }

    for (const call of toolCalls) {
      const result = await tools.run(
        call.function.name,
        call.function.arguments,
        toolContext,
      );
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  throw new Error("max_turns_exceeded");
}
