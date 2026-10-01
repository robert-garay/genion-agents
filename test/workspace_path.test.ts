import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { resolveWithinWorkspace } from "../src/tools/workspace_path.js";

const root = path.resolve("/tmp/genion-workspace-test");

test("allows files under workspace root", () => {
  const resolved = resolveWithinWorkspace(root, "README.md");
  assert.equal(resolved, path.join(root, "README.md"));
});

test("rejects parent traversal", () => {
  assert.equal(resolveWithinWorkspace(root, "../outside"), null);
  assert.equal(resolveWithinWorkspace(root, "foo/../../etc/passwd"), null);
});

test("rejects absolute paths", () => {
  assert.equal(resolveWithinWorkspace(root, "/etc/passwd"), null);
});

test("rejects null bytes", () => {
  assert.equal(resolveWithinWorkspace(root, "foo\0bar"), null);
});
