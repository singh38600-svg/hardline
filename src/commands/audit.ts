import pc from "picocolors";
import { discoverInstructions, compileInstruction } from "../extractors/instructions.js";

export function auditCommand(cwd: string): void {
  const instructions = discoverInstructions(cwd);
  const compiled = instructions.filter((i) => compileInstruction(i));
  const unique = new Set(instructions.map((i) => i.text.toLowerCase()));
  const duplicates = instructions.length - unique.size;
  console.log(pc.bold("Agent policy audit\n"));
  console.log(`${instructions.length} candidate instructions`);
  console.log(`${pc.green(String(compiled.length))} mechanically enforceable`);
  console.log(`${pc.yellow(String(duplicates))} exact duplicates`);
  console.log(`${instructions.length - compiled.length} remain context or need clarification`);
}
