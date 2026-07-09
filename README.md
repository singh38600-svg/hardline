# Hardline

> **Your AGENTS.md is a suggestion. Hardline makes it law.**

Hardline finds mechanically enforceable rules inside `CLAUDE.md`, `AGENTS.md`, and `GEMINI.md`, converts them into a typed policy, and compiles native Claude Code hooks that block violations before they happen.

```text
Markdown instructions → reviewed policy → deterministic enforcement
```

## The problem

Your instructions say:

```md
- Never modify .env.
- Always use pnpm, never npm.
- Do not add dependencies without approval.
- Run tests before saying the task is complete.
```

A probabilistic model can still ignore every line. Anything deterministic should not be entrusted to a prompt.

## Quick start

Run Hardline inside any project:

```bash
npx @hardline-ai/cli init
```

Review the generated policy, then activate it:

```bash
npx @hardline-ai/cli init --accept
npx @hardline-ai/cli compile --target claude
npx @hardline-ai/cli test
```

No global installation or API key is required.

## See it work

When Claude Code attempts:

```bash
npm install date-fns
```

Hardline returns:

```text
BLOCKED by use-pnpm
This repository uses pnpm.
Try: pnpm add <package>
```

When it tries to finish without fresh tests:

```text
STOP REJECTED
Run `pnpm test` successfully after the latest file change before finishing.
```

## Commands

```bash
hardline audit                 # Classify agent instructions without changing files
hardline init                  # Generate a reviewable policy draft
hardline init --accept         # Write .hardline/policy.yaml
hardline compile               # Install native Claude Code hooks
hardline test                  # Run adversarial policy simulations
hardline doctor                # Check installation
hardline explain HL-ABC123     # Explain a recorded decision
```

## Supported policies

### Protect files

```yaml
- id: protect-env
  description: Never modify environment files.
  type: file.write
  mode: deny
  paths: [".env*"]
```

### Block or approve commands

```yaml
- id: use-pnpm
  description: This repository uses pnpm.
  type: command.run
  mode: deny
  effect: deny
  patterns: ['(?:^|[;&|]\\s*)npm\\s+(?:i|install)\\b']
  replacement: pnpm add <package>
  testCommands: ["npm install zod"]
```

### Require approval for dependencies

```yaml
- id: approve-dependencies
  description: Dependency changes need a human decision.
  type: dependency.change
  mode: deny
  effect: require_approval
```

### Require fresh verification

```yaml
- id: verified-completion
  description: Tests must pass after the latest write.
  type: session.stop
  mode: deny
  require:
    - command: pnpm test
      freshAfter: last_write
```

## How it works

Hardline compiles policies into project-level Claude Code hooks:

- `PreToolUse` checks writes and commands before execution.
- `PostToolUse` records successful writes and command receipts.
- `Stop` rejects completion when required verification is missing or stale.

Runtime enforcement makes **zero LLM calls**. Model assistance may be added later for policy extraction, but generated rules will always require human review.

## Design principles

1. No generated policy activates without review.
2. Runtime enforcement is deterministic.
3. Every policy must have an adversarial test.
4. Every denial must explain itself.
5. Unsupported prose remains visible rather than being silently weakened.

## Status

`v0.1.0` is an MVP focused on Claude Code. Codex, Gemini CLI, Cursor, Git hooks, and CI adapters are planned after the policy IR stabilizes.

Hardline is not an operating-system sandbox. Read the [threat model](docs/threat-model.md).

## Contributing

Issues and pull requests are welcome. Start with a policy bypass, a new simulation fixture, or an agent adapter.

## License

Apache-2.0
