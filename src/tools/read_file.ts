import fs from "node:fs/promises";
import type { RegisteredTool, ToolContext } from "../types.js";
import { resolveWithinWorkspace } from "./workspace_path.js";

const MAX_BYTES = 128 * 1024;

export const readFileTool: RegisteredTool = {
  definition: {
    type: "function",
    function: {
      name: "read_file",
      description:
        "Read a UTF-8 text file relative to the project workspace root.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Path relative to workspace root",
          },
        },
        required: ["path"],
        additionalProperties: false,
      },
    },
  },
  handler: async (args, ctx: ToolContext) => {
    const rel = String(args.path ?? "").trim();
    if (!rel) {
      return JSON.stringify({ error: "missing_path" });
    }
    const full = resolveWithinWorkspace(ctx.workspaceRoot, rel);
    if (!full) {
      return JSON.stringify({ error: "path_outside_workspace" });
    }
    try {
      const stat = await fs.stat(full);
      if (!stat.isFile()) {
        return JSON.stringify({ error: "not_a_file" });
      }
      if (stat.size > MAX_BYTES) {
        const buf = Buffer.alloc(MAX_BYTES);
        const fh = await fs.open(full, "r");
        try {
          await fh.read(buf, 0, MAX_BYTES, 0);
        } finally {
          await fh.close();
        }
        return JSON.stringify({
          path: rel,
          truncated: true,
          content: buf.toString("utf8"),
        });
      }
      const content = await fs.readFile(full, "utf8");
      return JSON.stringify({ path: rel, truncated: false, content });
    } catch (e) {
      const message = e instanceof Error ? e.message : "read_failed";
      return JSON.stringify({ error: message });
    }
  },
};
