import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ToolRegistry } from "../src/tools/registry.js";
import type { ToolContext } from "../src/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

async function assertTool(
  registry: ToolRegistry,
  ctx: ToolContext,
  name: string,
  args: Record<string, unknown>,
  predicate: (parsed: Record<string, unknown>) => void,
): Promise<void> {
  const raw = await registry.run(name, JSON.stringify(args), ctx);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`${name}: invalid JSON result: ${raw}`);
  }
  if ("error" in parsed) {
    throw new Error(`${name}: ${String(parsed.error)}`);
  }
  predicate(parsed);
}

async function main(): Promise<void> {
  const memoryDir = await fs.mkdtemp(path.join(os.tmpdir(), "genion-smoke-"));
  const ctx: ToolContext = { workspaceRoot, memoryDir };
  const registry = new ToolRegistry();

  const names = registry.names();
  if (names.length !== 4) {
    throw new Error(`expected 4 tools, got ${names.join(", ")}`);
  }

  await assertTool(
    registry,
    ctx,
    "memory_set",
    { key: "smoke", value: "ok" },
    (p) => {
      if (p.ok !== true) throw new Error("memory_set: missing ok");
    },
  );

  await assertTool(registry, ctx, "memory_get", { key: "smoke" }, (p) => {
    if (p.value !== "ok")
      throw new Error(`memory_get: expected ok, got ${p.value}`);
  });

  await assertTool(registry, ctx, "read_file", { path: "README.md" }, (p) => {
    const content = String(p.content ?? "");
    if (!content.includes("Genion Agents")) {
      throw new Error("read_file: README content unexpected");
    }
  });

  const traversalAttempt = await registry.run(
    "read_file",
    JSON.stringify({ path: "../package.json" }),
    ctx,
  );
  const escapeParsed = JSON.parse(traversalAttempt) as Record<string, unknown>;
  if (escapeParsed.error !== "path_outside_workspace") {
    throw new Error("read_file: path escape not blocked");
  }

  await assertTool(
    registry,
    ctx,
    "fetch_url",
    { url: "https://example.com/" },
    (p) => {
      const status = Number(p.status);
      if (status < 200 || status >= 400) {
        throw new Error(`fetch_url: bad status ${status}`);
      }
      const body = String(p.body ?? "");
      if (!body.toLowerCase().includes("example")) {
        throw new Error("fetch_url: example.com body unexpected");
      }
    },
  );

  console.log("tools-smoke: all checks passed");
  console.log(`  registry: ${names.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
