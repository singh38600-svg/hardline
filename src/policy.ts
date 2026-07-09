import { z } from "zod";

const mode = z.enum(["audit", "warn", "deny"]).default("deny");
const source = z.object({
  file: z.string(),
  line: z.number().int().positive(),
  text: z.string(),
}).optional();

const base = {
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  description: z.string().min(1),
  mode,
  message: z.string().optional(),
  source,
};

export const FileWritePolicySchema = z.object({
  ...base,
  type: z.literal("file.write"),
  paths: z.array(z.string().min(1)).min(1),
});

export const CommandPolicySchema = z.object({
  ...base,
  type: z.literal("command.run"),
  effect: z.enum(["deny", "require_approval"]).default("deny"),
  patterns: z.array(z.string().min(1)).min(1),
  replacement: z.string().optional(),
  testCommands: z.array(z.string().min(1)).optional(),
});

export const DependencyPolicySchema = z.object({
  ...base,
  type: z.literal("dependency.change"),
  effect: z.literal("require_approval").default("require_approval"),
});

export const CompletionPolicySchema = z.object({
  ...base,
  type: z.literal("session.stop"),
  require: z.array(z.object({
    command: z.string().min(1),
    freshAfter: z.enum(["last_write", "never"]).default("last_write"),
  })).min(1),
});

export const PolicySchema = z.discriminatedUnion("type", [
  FileWritePolicySchema,
  CommandPolicySchema,
  DependencyPolicySchema,
  CompletionPolicySchema,
]);

export const PolicyFileSchema = z.object({
  version: z.literal(1),
  policies: z.array(PolicySchema),
});

export type Policy = z.infer<typeof PolicySchema>;
export type PolicyFile = z.infer<typeof PolicyFileSchema>;
export type FileWritePolicy = z.infer<typeof FileWritePolicySchema>;
export type CommandPolicy = z.infer<typeof CommandPolicySchema>;
export type CompletionPolicy = z.infer<typeof CompletionPolicySchema>;
