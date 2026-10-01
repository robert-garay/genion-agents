import path from "node:path";
import { FileMemoryStore } from "../memory/store.js";
import type { RegisteredTool, ToolContext } from "../types.js";

const MAX_KEY_LEN = 256;
const MAX_VALUE_LEN = 64 * 1024;

function storeFor(ctx: ToolContext): FileMemoryStore {
  return new FileMemoryStore(path.join(ctx.memoryDir, "memory.json"));
}

function validateKey(key: string): string | null {
  const trimmed = key.trim();
  if (!trimmed) {
    return "invalid_key";
  }
  if (trimmed.length > MAX_KEY_LEN) {
    return "key_too_long";
  }
  return null;
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
    const keyErr = validateKey(key);
    if (keyErr) {
      return JSON.stringify({ error: keyErr });
    }
    const value = await storeFor(ctx).get(key.trim());
    return JSON.stringify({ key: key.trim(), value });
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
    const keyErr = validateKey(key);
    if (keyErr) {
      return JSON.stringify({ error: keyErr });
    }
    const value = String(args.value ?? "");
    if (value.length > MAX_VALUE_LEN) {
      return JSON.stringify({ error: "value_too_long" });
    }
    const trimmedKey = key.trim();
    await storeFor(ctx).set(trimmedKey, value);
    return JSON.stringify({ ok: true, key: trimmedKey });
  },
};
