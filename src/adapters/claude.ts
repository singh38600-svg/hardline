import fs from "node:fs";
import path from "node:path";

interface Settings { hooks?: Record<string, unknown[]>; [key: string]: unknown }
const COMMANDS = {
  PreToolUse: "npx --no-install hardline hook pre-tool-use",
  PostToolUse: "npx --no-install hardline hook post-tool-use",
  Stop: "npx --no-install hardline hook stop",
};

function handler(command: string) { return { type: "command", command, timeout: 10, statusMessage: "Hardline policy check" }; }
function group(event: keyof typeof COMMANDS) {
  if (event === "PreToolUse" || event === "PostToolUse") return { matcher: "Bash|Edit|Write", hooks: [handler(COMMANDS[event])] };
  return { hooks: [handler(COMMANDS[event])] };
}

export function compileClaude(cwd: string): string {
  const filename = path.join(cwd, ".claude/settings.json");
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  let settings: Settings = {};
  if (fs.existsSync(filename)) settings = JSON.parse(fs.readFileSync(filename, "utf8")) as Settings;
  settings.hooks ??= {};
  for (const event of Object.keys(COMMANDS) as Array<keyof typeof COMMANDS>) {
    const current = (settings.hooks[event] ?? []) as Array<Record<string, unknown>>;
    const serialized = JSON.stringify(current);
    if (!serialized.includes(COMMANDS[event])) current.push(group(event));
    settings.hooks[event] = current;
  }
  fs.writeFileSync(filename, JSON.stringify(settings, null, 2) + "\n", "utf8");
  return filename;
}
