import pc from "picocolors";
import { findEvent } from "../runtime/events.js";

export function explainCommand(cwd: string, id: string): void {
  const event = findEvent(cwd, id);
  if (!event) throw new Error(`No Hardline event found with id ${id}.`);
  console.log(pc.bold(`${event.id} — ${event.action.toUpperCase()}`));
  console.log(`Policy: ${event.policyId}`);
  console.log(`Time: ${event.at}`);
  console.log(`Reason: ${event.reason}`);
}
