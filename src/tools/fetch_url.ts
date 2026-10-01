import type { RegisteredTool, ToolContext } from "../types.js";

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 256 * 1024;

export const fetchUrlTool: RegisteredTool = {
  definition: {
    type: "function",
    function: {
      name: "fetch_url",
      description:
        "HTTP GET a URL and return response body text (truncated, timeout limited).",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "Absolute http or https URL" },
        },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
  handler: async (args, _ctx: ToolContext) => {
    const url = String(args.url ?? "");
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return JSON.stringify({ error: "invalid_url" });
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return JSON.stringify({ error: "unsupported_protocol" });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(parsed.toString(), {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
      });
      const buf = Buffer.from(await res.arrayBuffer());
      const truncated = buf.length > MAX_BYTES;
      const body = (truncated ? buf.subarray(0, MAX_BYTES) : buf).toString(
        "utf8",
      );
      return JSON.stringify({
        status: res.status,
        truncated,
        bytes: buf.length,
        body,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "fetch_failed";
      return JSON.stringify({ error: message });
    } finally {
      clearTimeout(timer);
    }
  },
};
