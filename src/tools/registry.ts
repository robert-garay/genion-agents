import type { RegisteredTool, ToolContext, ToolDefinition } from "../types.js";
import { fetchUrlTool } from "./fetch_url.js";
import { memoryGetTool, memorySetTool } from "./memory_tools.js";
import { readFileTool } from "./read_file.js";

const DEFAULT_TOOLS: RegisteredTool[] = [
  fetchUrlTool,
  readFileTool,
  memoryGetTool,
  memorySetTool,
];

export class ToolRegistry {
  private readonly byName = new Map<string, RegisteredTool>();

  constructor(tools: RegisteredTool[] = DEFAULT_TOOLS) {
    for (const t of tools) {
      this.byName.set(t.definition.function.name, t);
    }
  }

  definitions(): ToolDefinition[] {
    return [...this.byName.values()].map((t) => t.definition);
  }

  async run(name: string, argsJson: string, ctx: ToolContext): Promise<string> {
    const tool = this.byName.get(name);
    if (!tool) {
      return JSON.stringify({ error: "unknown_tool", name });
    }
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(argsJson) as Record<string, unknown>;
    } catch {
      return JSON.stringify({ error: "invalid_arguments_json" });
    }
    return tool.handler(args, ctx);
  }
}
