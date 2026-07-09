import { minimatch } from "minimatch";
import type { PolicyFile, Policy } from "../policy.js";
import { normalizeRelative } from "../paths.js";
import type { Decision, HookInput, RuntimeState } from "./types.js";

function decisionFor(policy: Policy, action: Decision["action"], reason: string, replacement?: string): Decision {
  if (policy.mode === "audit" || policy.mode === "warn") return { action: "allow", policyId: policy.id, reason };
  return { action, policyId: policy.id, reason, ...(replacement ? { replacement } : {}) };
}

function regexMatches(pattern: string, command: string): boolean {
  try { return new RegExp(pattern, "i").test(command); }
  catch { return command.includes(pattern); }
}

export function isDependencyCommand(command: string): boolean {
  return /(?:^|[;&|]\s*)(?:npm\s+(?:i|install|uninstall)|pnpm\s+(?:add|remove)|yarn\s+(?:add|remove)|bun\s+(?:add|remove)|pip(?:3)?\s+install|poetry\s+add|cargo\s+add)\b/i.test(command);
}

export function evaluatePreToolUse(input: HookInput, policyFile: PolicyFile, cwd: string): Decision {
  const tool = input.tool_name;
  const payload = input.tool_input ?? {};

  if (tool === "Write" || tool === "Edit") {
    const filePath = typeof payload.file_path === "string" ? payload.file_path : "";
    const relative = normalizeRelative(filePath, cwd);
    for (const policy of policyFile.policies) {
      if (policy.type !== "file.write") continue;
      if (policy.paths.some((glob) => minimatch(relative, glob, { dot: true, nocase: process.platform === "win32" }))) {
        const reason = policy.message ?? `${relative} is protected by ${policy.id}.`;
        return decisionFor(policy, "deny", reason);
      }
    }
  }

  if (tool === "Bash") {
    const command = typeof payload.command === "string" ? payload.command : "";
    for (const policy of policyFile.policies) {
      if (policy.type === "command.run" && policy.patterns.some((pattern) => regexMatches(pattern, command))) {
        const action = policy.effect === "require_approval" ? "ask" : "deny";
        const reason = policy.message ?? `Command blocked by ${policy.id}.`;
        return decisionFor(policy, action, reason, policy.replacement);
      }
      if (policy.type === "dependency.change" && isDependencyCommand(command)) {
        const reason = policy.message ?? `Dependency changes require approval (${policy.id}).`;
        return decisionFor(policy, "ask", reason);
      }
    }
  }
  return { action: "allow" };
}

export function evaluateStop(input: HookInput, policyFile: PolicyFile, state: RuntimeState): Decision {
  if (input.stop_hook_active) return { action: "allow" };
  for (const policy of policyFile.policies) {
    if (policy.type !== "session.stop") continue;
    for (const requirement of policy.require) {
      const receipt = [...state.commandReceipts].reverse().find((entry) => entry.command === requirement.command);
      const stale = requirement.freshAfter === "last_write" && state.lastWriteAt !== undefined && (!receipt || receipt.at < state.lastWriteAt);
      if (!receipt || stale) {
        const reason = policy.message ?? `Run \`${requirement.command}\` successfully after the latest file change before finishing.`;
        return decisionFor(policy, "block", reason);
      }
    }
  }
  return { action: "allow" };
}
