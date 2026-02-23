import { describe, it, expect, vi } from "vitest";
import { execSync } from "child_process";
import { SemgrepService } from "../../app/services/semgrep.service.js";

vi.mock("child_process");

describe("SemgrepService", () => {
  it("returns empty for empty files", async () => {
    const semgrep = new SemgrepService();
    const result = await semgrep.scan([]);
    expect(result).toEqual([]);
    expect(execSync).not.toHaveBeenCalled();
  });

  it("returns results from semgrep", async () => {
    vi.mocked(execSync).mockReturnValue(
      JSON.stringify({ results: [{ id: "rule1" }] }) as never
    );

    const semgrep = new SemgrepService();
    const result = await semgrep.scan(["src/foo.ts"]);
    expect(result).toEqual([{ id: "rule1" }]);
  });

  it("returns empty on semgrep not installed", async () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error("semgrep not found");
    });

    const semgrep = new SemgrepService();
    const result = await semgrep.scan(["src/foo.ts"]);
    expect(result).toEqual([]);
  });
});
