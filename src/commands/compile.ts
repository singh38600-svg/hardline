import pc from "picocolors";
import { loadPolicyFile } from "../config.js";
import { compileClaude } from "../adapters/claude.js";

export function compileCommand(cwd: string, target: string): void {
  const policy = loadPolicyFile(cwd);
  if (target !== "claude") throw new Error(`Unsupported target: ${target}. MVP supports claude.`);
  const filename = compileClaude(cwd);
  console.log(pc.green(`Compiled ${policy.policies.length} policies for Claude Code.`));
  console.log(`Updated ${filename}`);
}
