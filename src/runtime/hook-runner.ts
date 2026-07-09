import { loadPolicyFile } from "../config.js";
import { evaluatePreToolUse, evaluateStop } from "./evaluator.js";
import { logEvent } from "./events.js";
import { readState, writeState } from "./state.js";
import type { HookInput } from "./types.js";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function output(value: unknown): void {
  process.stdout.write(JSON.stringify(value));
}

export async function runHook(kind: "pre-tool-use" | "post-tool-use" | "stop"): Promise<void> {
  const raw = await readStdin();
  const input = JSON.parse(raw || "{}") as HookInput;
  const cwd = input.cwd ?? process.cwd();
  const policy = loadPolicyFile(cwd);

  if (kind === "pre-tool-use") {
    const decision = evaluatePreToolUse(input, policy, cwd);
    if (decision.policyId && decision.reason) {
      const event = logEvent(cwd, { policyId: decision.policyId, action: decision.action, reason: decision.reason, input });
      if (decision.action === "deny" || decision.action === "ask") {
        const suffix = decision.replacement ? ` Try: ${decision.replacement}` : "";
        output({ hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: decision.action,
          permissionDecisionReason: `${decision.reason}${suffix} [${event.id}]`,
        }});
      }
    }
    return;
  }

  if (kind === "post-tool-use") {
    const state = readState(cwd);
    const now = Date.now();
    if (input.tool_name === "Write" || input.tool_name === "Edit") state.lastWriteAt = now;
    if (input.tool_name === "Bash") {
      const command = input.tool_input?.command;
      if (typeof command === "string") {
        state.commandReceipts.push({ command, at: now, ...(input.session_id ? { sessionId: input.session_id } : {}) });
        state.commandReceipts = state.commandReceipts.slice(-100);
      }
    }
    writeState(cwd, state);
    return;
  }

  const decision = evaluateStop(input, policy, readState(cwd));
  if (decision.action === "block" && decision.policyId && decision.reason) {
    const event = logEvent(cwd, { policyId: decision.policyId, action: "block", reason: decision.reason, input });
    output({ decision: "block", reason: `${decision.reason} [${event.id}]` });
  }
}
