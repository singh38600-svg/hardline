import path from "node:path";

export function projectPath(cwd: string, ...segments: string[]): string {
  return path.join(cwd, ...segments);
}

export function normalizeRelative(input: string, cwd: string): string {
  const absolute = path.isAbsolute(input) ? input : path.resolve(cwd, input);
  const relative = path.relative(cwd, absolute);
  return relative.split(path.sep).join("/");
}
