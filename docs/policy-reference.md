# Policy reference

Hardline policies live in `.hardline/policy.yaml`.

## Common fields

- `id`: stable lowercase identifier.
- `description`: human-readable purpose.
- `type`: policy evaluator.
- `mode`: `audit`, `warn`, or `deny`.
- `message`: optional custom explanation.
- `source`: optional original instruction location.

## `file.write`

Matches project-relative paths using minimatch globs. Evaluated before Claude Code `Write` and `Edit` tools execute.

## `command.run`

Matches Bash input using JavaScript regular expressions. `effect` is `deny` or `require_approval`. Add at least one `testCommands` fixture so `hardline test` can attempt a real violation.

## `dependency.change`

Requests human approval for common Node, Python, Rust, and Bun package-add/remove commands.

## `session.stop`

Requires successful command receipts. With `freshAfter: last_write`, the receipt must be newer than the latest successful `Write` or `Edit` tool call.
