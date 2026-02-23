import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs/promises";
import { ReportService } from "../../app/services/report.service.js";

vi.mock("fs/promises");

describe("ReportService", () => {
  let report: ReportService;

  beforeEach(() => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    report = new ReportService();
  });

  it("saves JSON and MD files", async () => {
    await report.save({
      prUrl: "https://github.com/o/r/pull/1",
      findings: [],
      score: 95,
      markdown: "# Review\nScore: 95",
    });

    expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
  });
});
