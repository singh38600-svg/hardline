import fs from "node:fs";
import path from "node:path";
import type { Policy } from "../policy.js";

export interface Instruction {
  file: string;
  line: number;
  text: string;
}

const FILES = ["CLAUDE.md", "AGENTS.md", "GEMINI.md"];

export function discoverInstructions(cwd: string): Instruction[] {
  const results: Instruction[] = [];
  for (const filename of FILES) {
    const full = path.join(cwd, filename);
    if (!fs.existsSync(full)) continue;
    fs.readFileSync(full, "utf8").split("\n").forEach((line, index) => {
      const text = line.replace(/^\s*(?:[-*+] |\d+[.)]\s+)/, "").trim();
      if (text && /\b(?:never|always|must|do not|don't|required|before finishing|before claiming)\b/i.test(text)) {
        results.push({ file: filename, line: index + 1, text });
      }
    });
  }
  return results;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "rule";
}

function source(i: Instruction) { return { file: i.file, line: i.line, text: i.text }; }

export function compileInstruction(i: Instruction): Policy | undefined {
  const text = i.text;
  if (/\b(?:use|always use)\s+pnpm\b/i.test(text) && /\b(?:never|not|instead of)\s+(?:use\s+)?npm\b/i.test(text)) {
    return { id: "use-pnpm", description: text, type: "command.run", mode: "deny", effect: "deny", patterns: ["(?:^|[;&|]\\s*)npm\\s+(?:i|install)\\b"], replacement: "pnpm add <package>", testCommands: ["npm install zod"], source: source(i) };
  }
  const test = text.match(/(?:run|must run)\s+[`'"]?([^`'"]*?(?:test|lint|check|build)[^`'"]*)[`'"]?\s+(?:before|prior to)/i);
  if (test?.[1]) {
    const command = test[1].trim().replace(/[.!]$/, "");
    return { id: `verify-${slug(command)}`, description: text, type: "session.stop", mode: "deny", require: [{ command, freshAfter: "last_write" }], source: source(i) };
  }
  const pathMatch = text.match(/(?:never|do not|don't)\s+(?:modify|edit|write|touch|change)\s+(?:files?\s+(?:in|under)\s+)?(?:[`'"]([^`'"]+)[`'"]|([^\s,;]+))/i);
  const capturedPath = pathMatch?.[1] ?? pathMatch?.[2];
  if (capturedPath) {
    let p = capturedPath.trim().replace(/[.!]+$/, "");
    if (p.endsWith("/")) p += "**";
    else if (!p.includes("*") && !path.extname(p) && !p.startsWith(".")) p = `${p.replace(/\/$/, "")}/**`;
    return { id: `protect-${slug(p)}`, description: text, type: "file.write", mode: "deny", paths: [p], source: source(i) };
  }
  if (/\b(?:do not|don't|never)\s+add\s+dependencies\b/i.test(text)) {
    return { id: "approve-dependencies", description: text, type: "dependency.change", mode: "deny", effect: "require_approval", source: source(i) };
  }
  return undefined;
}
