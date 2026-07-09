import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import { POLICY_PATH, loadPolicyFile } from "../config.js";

export function doctorCommand(cwd: string): void {
  const checks: Array<[string, boolean]> = [];
  try { loadPolicyFile(cwd); checks.push([`${POLICY_PATH} is valid`, true]); }
  catch { checks.push([`${POLICY_PATH} is valid`, false]); }
  const settings = path.join(cwd, ".claude/settings.json");
  checks.push(["Claude Code settings exist", fs.existsSync(settings)]);
  checks.push(["local hardline binary is installed", fs.existsSync(path.join(cwd, "node_modules/.bin/hardline")) || process.argv[1]?.includes("hardline") === true]);
  for (const [label, ok] of checks) console.log(`${ok ? pc.green("✓") : pc.red("✗")} ${label}`);
  if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
}
