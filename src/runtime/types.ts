export interface HookInput {
  session_id?: string;
  cwd?: string;
  hook_event_name: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: unknown;
  stop_hook_active?: boolean;
}

export interface Decision {
  action: "allow" | "deny" | "ask" | "block";
  policyId?: string;
  reason?: string;
  replacement?: string;
}

export interface RuntimeState {
  lastWriteAt?: number;
  commandReceipts: Array<{
    command: string;
    at: number;
    sessionId?: string;
  }>;
}
