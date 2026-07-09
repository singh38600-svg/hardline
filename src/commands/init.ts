import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import YAML from "yaml";
import { discoverInstructions, compileInstruction } from "../extractors/instructions.js";
import { PolicyFileSchema } from "../policy.js";
import { writePolicyFile } from "../config.js";

export function initCommand(cwd: string, accept: boolean): void {
  const draft = path.join(cwd, ".hardline/policy.draft.yaml");
  if (accept && fs.existsSync(draft)) {
    const reviewed = PolicyFileSchema.parse(YAML.parse(fs.readFileSync(draft, "utf8")));
    writePolicyFile(reviewed, cwd);
    console.log(pc.green(`Accepted ${reviewed.policies.length} reviewed policies.`));
    console.log("Wrote .hardline/policy.yaml");
    return;
  }

  const instructions = discoverInstructions(cwd);
  const policies = instructions.map(compileInstruction).filter((p) => p !== undefined);
  const target = accept ? ".hardline/policy.yaml" : ".hardline/policy.draft.yaml";
  writePolicyFile({ version: 1, policies }, cwd, target);
  console.log(pc.bold(`Found ${instructions.length} candidate instructions`));
  console.log(`${pc.green(String(policies.length))} mechanically enforceable`);
  console.log(`${pc.yellow(String(instructions.length - policies.length))} kept as prose or ambiguous`);
  console.log(`\nWrote ${target}`);
  if (!accept) console.log(`Review it, then run ${pc.cyan("hardline init --accept")}.`);
}
