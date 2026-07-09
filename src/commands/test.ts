import pc from "picocolors";
import { loadPolicyFile } from "../config.js";
import { evaluatePreToolUse, evaluateStop } from "../runtime/evaluator.js";
import type { RuntimeState } from "../runtime/types.js";

export function testCommand(cwd: string): void {
  const file = loadPolicyFile(cwd);
  let passed = 0;
  let total = 0;
  for (const policy of file.policies) {
    if (policy.type === "file.write") {
      for (const glob of policy.paths) {
        total++;
        const sample = glob.replace(/\*\*/g, "sample.txt").replace(/\*/g, "sample");
        const result = evaluatePreToolUse({ hook_event_name: "PreToolUse", tool_name: "Write", tool_input: { file_path: sample } }, file, cwd);
        if (result.policyId === policy.id) { passed++; console.log(pc.green(`✓ ${policy.id} blocks ${sample}`)); }
        else console.log(pc.red(`✗ ${policy.id} did not block ${sample}`));
      }
    } else if (policy.type === "command.run") {
      total++;
      const sample = policy.testCommands?.[0];
      if (!sample) {
        console.log(pc.yellow(`- ${policy.id} has no testCommands fixture; add one for adversarial simulation`));
        total--;
        continue;
      }
      const result = evaluatePreToolUse({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: sample } }, file, cwd);
      if (result.policyId === policy.id) { passed++; console.log(pc.green(`✓ ${policy.id} catches ${sample}`)); }
      else console.log(pc.red(`✗ ${policy.id} did not catch ${sample}`));
    } else if (policy.type === "dependency.change") {
      total++;
      const result = evaluatePreToolUse({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "pnpm add zod" } }, file, cwd);
      if (result.policyId === policy.id) { passed++; console.log(pc.green(`✓ ${policy.id} asks before dependency changes`)); }
      else console.log(pc.red(`✗ ${policy.id} did not catch dependency change`));
    } else if (policy.type === "session.stop") {
      total++;
      const empty: RuntimeState = { commandReceipts: [], lastWriteAt: Date.now() };
      const result = evaluateStop({ hook_event_name: "Stop", stop_hook_active: false }, file, empty);
      if (result.action === "block") { passed++; console.log(pc.green(`✓ ${policy.id} rejects missing/stale verification`)); }
      else console.log(pc.red(`✗ ${policy.id} allowed missing verification`));
    }
  }
  console.log(`\n${passed}/${total} simulations passed.`);
  if (passed !== total) process.exitCode = 1;
}
