import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { PolicyFileSchema, type PolicyFile } from "./policy.js";

export const POLICY_PATH = ".hardline/policy.yaml";

export function loadPolicyFile(cwd = process.cwd()): PolicyFile {
  const filename = path.join(cwd, POLICY_PATH);
  if (!fs.existsSync(filename)) {
    throw new Error(`No ${POLICY_PATH} found. Run hardline init first.`);
  }
  const parsed = YAML.parse(fs.readFileSync(filename, "utf8"));
  return PolicyFileSchema.parse(parsed);
}

export function writePolicyFile(policy: PolicyFile, cwd = process.cwd(), filename = POLICY_PATH): void {
  const full = path.join(cwd, filename);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, YAML.stringify(policy), "utf8");
}
