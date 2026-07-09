import { describe, expect, it } from "vitest";
import { compileInstruction } from "../src/extractors/instructions.js";

describe("instruction compiler", () => {
  it("compiles pnpm policy", () => {
    const result = compileInstruction({ file: "CLAUDE.md", line: 4, text: "Always use pnpm, never npm." });
    expect(result).toMatchObject({ id: "use-pnpm", type: "command.run" });
  });
  it("compiles dotfile protection", () => {
    const result = compileInstruction({ file: "CLAUDE.md", line: 2, text: "Never modify .env files." });
    expect(result).toMatchObject({ type: "file.write", paths: [".env"] });
  });
  it("compiles protected path", () => {
    const result = compileInstruction({ file: "AGENTS.md", line: 2, text: "Never modify generated/." });
    expect(result).toMatchObject({ type: "file.write", paths: ["generated/**"] });
  });
  it("compiles verification", () => {
    const result = compileInstruction({ file: "CLAUDE.md", line: 8, text: "Run pnpm test before finishing." });
    expect(result).toMatchObject({ type: "session.stop", require: [{ command: "pnpm test", freshAfter: "last_write" }] });
  });
});
