import { describe, it, expect, vi } from "vitest";
import { LinterService } from "../../app/services/linter.service.js";

const mockLintFiles = vi.fn().mockResolvedValue([]);
vi.mock("eslint", () => ({
  ESLint: vi.fn().mockImplementation(() => ({
    lintFiles: mockLintFiles,
  })),
}));

describe("LinterService", () => {
  beforeEach(() => mockLintFiles.mockClear());

  it("returns empty array for empty files", async () => {
    const linter = new LinterService();
    const results = await linter.run([]);
    expect(results).toEqual([]);
    expect(mockLintFiles).not.toHaveBeenCalled();
  });

  it("filters to ts/js files only", async () => {
    const linter = new LinterService();
    await linter.run(["src/foo.ts", "readme.md", "src/bar.jsx"]);
    expect(mockLintFiles).toHaveBeenCalledWith(["src/foo.ts", "src/bar.jsx"]);
  });
});
