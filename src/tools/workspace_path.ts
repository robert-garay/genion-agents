import path from "node:path";

/**
 * Resolve a user-supplied relative path to an absolute path under workspaceRoot.
 * Returns null if the path escapes the workspace or is invalid.
 */
export function resolveWithinWorkspace(
  workspaceRoot: string,
  userPath: string,
): string | null {
  if (!userPath || userPath.includes("\0")) {
    return null;
  }
  if (path.isAbsolute(userPath)) {
    return null;
  }

  const root = path.resolve(workspaceRoot);
  const full = path.resolve(root, userPath);
  const relative = path.relative(root, full);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return full;
}
