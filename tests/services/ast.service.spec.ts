import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs/promises";
import { ASTService } from "../../app/services/ast.service.js";

vi.mock("fs/promises");

describe("ASTService", () => {
  let ast: ASTService;

  beforeEach(() => {
    vi.mocked(fs.readFile).mockReset();
    ast = new ASTService();
  });

  it("returns empty for empty files", async () => {
    const result = await ast.analyzeComplexity([]);
    expect(result).toEqual({});
  });

  it("skips non-ts files", async () => {
    const result = await ast.analyzeComplexity(["readme.md", "package.json"]);
    expect(result).toEqual({});
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it("computes complexity for ts file", async () => {
    vi.mocked(fs.readFile).mockResolvedValue(`
      if (a) { }
      for (let i = 0; i < 5; i++) { }
    `);

    const result = await ast.analyzeComplexity(["src/foo.ts"]);
    expect(result["src/foo.ts"]).toBeGreaterThanOrEqual(1);
  });
});
