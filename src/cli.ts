#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { initCommand } from "./commands/init.js";
import { compileCommand } from "./commands/compile.js";
import { testCommand } from "./commands/test.js";
import { auditCommand } from "./commands/audit.js";
import { doctorCommand } from "./commands/doctor.js";
import { explainCommand } from "./commands/explain.js";
import { runHook } from "./runtime/hook-runner.js";

const program = new Command();
program.name("hardline").description("Turn soft AI-agent instructions into hard runtime rules.").version("0.1.0");
program.command("init").description("Find enforceable instructions and generate a reviewed policy draft")
  .option("--accept", "write directly to .hardline/policy.yaml")
  .action((options) => initCommand(process.cwd(), Boolean(options.accept)));
program.command("audit").description("Classify rules without changing files").action(() => auditCommand(process.cwd()));
program.command("compile").description("Compile policies into native agent hooks")
  .option("--target <target>", "agent target", "claude")
  .action((options) => compileCommand(process.cwd(), options.target));
program.command("test").description("Run adversarial simulations against policies").action(() => testCommand(process.cwd()));
program.command("doctor").description("Check installation and common bypasses").action(() => doctorCommand(process.cwd()));
program.command("explain <event-id>").description("Explain a recorded policy decision").action((id) => explainCommand(process.cwd(), id));
program.command("hook <kind>", { hidden: true }).description("Internal native-hook entry point")
  .action(async (kind: string) => {
    if (!["pre-tool-use", "post-tool-use", "stop"].includes(kind)) throw new Error(`Unknown hook kind: ${kind}`);
    await runHook(kind as "pre-tool-use" | "post-tool-use" | "stop");
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(pc.red(`Hardline: ${message}`));
  process.exitCode = 1;
});
