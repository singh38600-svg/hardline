# Threat model

Hardline is a repository policy layer, not an operating-system sandbox.

## It protects against

- accidental agent writes to protected paths through supported tools;
- commands matching repository-specific deny or approval rules;
- completion claims without a recorded, successful post-write verification command;
- silent policy decisions by recording explainable local events.

## It does not protect against

- a malicious process with unrestricted filesystem access;
- an agent that can disable hooks or replace the Hardline binary outside repository controls;
- tools and clients that do not invoke the configured lifecycle hooks;
- arbitrary shell side effects hidden inside allowed commands.

Use containers, VMs, operating-system permissions, branch protection, and CI for hostile code or untrusted repositories.
