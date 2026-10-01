import path from "node:path";
import { FileMemoryStore } from "../memory/store.js";
import type { RegisteredTool, ToolContext } from "../types.js";

function storeFor(ctx: ToolContext): FileMemoryStore {
  return new FileMemoryStore(path.join(ctx.memoryDir, "memory.json"));
}

export const memoryGetTool: RegisteredTool = {
  definition: {
    type: "function",
    function: {
      name: "memory_get",
      description: "Get a string value from durable agent memory by key.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string" },
        },
        required: ["key"],
        additionalProperties: false,
      },
    },
  },
  handler: async (args, ctx) => {
    const key = String(args.key ?? "");
    const value = await storeFor(ctx).get(key);
    return JSON.stringify({ key, value });
  },
};

export const memorySetTool: RegisteredTool = {
  definition: {
    type: "function",
    function: {
      name: "memory_set",
      description: "Set a string value in durable agent memory by key.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "string" },
        },
        required: ["key", "value"],
        additionalProperties: false,
      },
    },
  },
  handler: async (args, ctx) => {
    const key = String(args.key ?? "");
    const value = String(args.value ?? "");
    await storeFor(ctx).set(key, value);
    return JSON.stringify({ ok: true, key });
  },
};
