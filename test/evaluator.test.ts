import { describe, expect, it } from "vitest";
import { evaluatePreToolUse, evaluateStop } from "../src/runtime/evaluator.js";
import type { PolicyFile } from "../src/policy.js";

const policy: PolicyFile = {
  version: 1,
  policies: [
    { id: "protect-env", description: "Protect env", type: "file.write", mode: "deny", paths: [".env*"] },
    { id: "use-pnpm", description: "Use pnpm", type: "command.run", mode: "deny", effect: "deny", patterns: ["(?:^|[;&|]\\s*)npm\\s+(?:i|install)\\b"], replacement: "pnpm add <package>" },
    { id: "approve-deps", description: "Approve deps", type: "dependency.change", mode: "deny", effect: "require_approval" },
    { id: "fresh-tests", description: "Fresh tests", type: "session.stop", mode: "deny", require: [{ command: "pnpm test", freshAfter: "last_write" }] },
  ],
};

describe("pre-tool policies", () => {
  it("blocks protected files", () => {
    const result = evaluatePreToolUse({ hook_event_name: "PreToolUse", tool_name: "Write", tool_input: { file_path: "/repo/.env.local" } }, policy, "/repo");
    expect(result).toMatchObject({ action: "deny", policyId: "protect-env" });
  });
  it("blocks npm", () => {
    const result = evaluatePreToolUse({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "npm install zod" } }, policy, "/repo");
    expect(result).toMatchObject({ action: "deny", policyId: "use-pnpm" });
  });
  it("asks before dependency changes", () => {
    const result = evaluatePreToolUse({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "pnpm add zod" } }, policy, "/repo");
    expect(result).toMatchObject({ action: "ask", policyId: "approve-deps" });
  });
});

describe("completion policies", () => {
  it("blocks stale tests", () => {
    const result = evaluateStop({ hook_event_name: "Stop", stop_hook_active: false }, policy, { lastWriteAt: 200, commandReceipts: [{ command: "pnpm test", at: 100 }] });
    expect(result.action).toBe("block");
  });
  it("allows fresh tests", () => {
    const result = evaluateStop({ hook_event_name: "Stop", stop_hook_active: false }, policy, { lastWriteAt: 100, commandReceipts: [{ command: "pnpm test", at: 200 }] });
    expect(result.action).toBe("allow");
  });
  it("avoids infinite stop loops", () => {
    const result = evaluateStop({ hook_event_name: "Stop", stop_hook_active: true }, policy, { commandReceipts: [] });
    expect(result.action).toBe("allow");
  });
});
