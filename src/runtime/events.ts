import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface EventRecord {
  id: string;
  at: string;
  policyId: string;
  action: string;
  reason: string;
  input: unknown;
}

export function logEvent(cwd: string, event: Omit<EventRecord, "id" | "at">): EventRecord {
  const record: EventRecord = {
    ...event,
    id: `HL-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    at: new Date().toISOString(),
  };
  const filename = path.join(cwd, ".hardline/events.jsonl");
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.appendFileSync(filename, JSON.stringify(record) + "\n", "utf8");
  return record;
}

export function findEvent(cwd: string, id: string): EventRecord | undefined {
  const filename = path.join(cwd, ".hardline/events.jsonl");
  if (!fs.existsSync(filename)) return undefined;
  return fs.readFileSync(filename, "utf8").trim().split("\n").filter(Boolean)
    .map((line) => JSON.parse(line) as EventRecord)
    .find((record) => record.id === id);
}
