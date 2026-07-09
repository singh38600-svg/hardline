import fs from "node:fs";
import path from "node:path";
import type { RuntimeState } from "./types.js";

const EMPTY: RuntimeState = { commandReceipts: [] };

export function statePath(cwd: string): string {
  return path.join(cwd, ".hardline/state.json");
}

export function readState(cwd: string): RuntimeState {
  try {
    return { ...EMPTY, ...JSON.parse(fs.readFileSync(statePath(cwd), "utf8")) } as RuntimeState;
  } catch {
    return { commandReceipts: [] };
  }
}

export function writeState(cwd: string, state: RuntimeState): void {
  const filename = statePath(cwd);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, JSON.stringify(state, null, 2) + "\n", "utf8");
}
