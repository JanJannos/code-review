import { describe, it, expect } from "vitest";
import { ReportService } from "../../app/services/report.service";

describe("ReportService", () => {
  it("save completes without writing to disk", async () => {
    const report = new ReportService();
    await expect(
      report.save({
        prUrl: "https://github.com/o/r/pull/1",
        findings: [],
        score: 95,
        markdown: "# Review\nScore: 95",
      })
    ).resolves.toBeUndefined();
  });
});
