import { describe, it, expect, vi, beforeAll } from "vitest";
import path from "path";
import fs from "fs/promises";
import { loadCodeExamples } from "../app/services/local-files.service.js";

vi.mock("../app/services/git.service.js", () => ({
  GitService: vi.fn().mockImplementation(() => ({
    getPRDiff: vi.fn().mockImplementation(async () => loadCodeExamples()),
  })),
}));

vi.mock("../app/services/notification.service.js", () => ({
  NotificationService: vi.fn().mockImplementation(() => ({
    postPRComment: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("../app/services/report.service.js", () => ({
  ReportService: vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe("code-examples integration", () => {
  beforeAll(async () => {
    const examplesDir = path.join(process.cwd(), "code-examples");
    try {
      await fs.access(examplesDir);
    } catch {
      await fs.mkdir(examplesDir, { recursive: true });
      await fs.writeFile(
        path.join(examplesDir, "sample.ts"),
        "export const x = 1;\n"
      );
    }
  });

  it("runs full review graph on code-examples files", async () => {
    const { diff, files } = await loadCodeExamples();
    expect(files.length).toBeGreaterThan(0);
    expect(diff.length).toBeGreaterThan(0);

    if (!process.env.ANTHROPIC_API_KEY) return;
    const { buildReviewGraph } = await import("../app/graph/review.graph.js");
    const graph = buildReviewGraph();
    const result = await graph.invoke({
      prUrl: "https://github.com/test/repo/pull/1",
      prNumber: 1,
      repo: "test/repo",
      diff: "",
      files: [],
      language: "",
      staticFindings: [],
      securityFindings: [],
      architectureFindings: [],
      testFindings: [],
      docFindings: [],
      status: "pending",
    });

    expect(result.status).toBe("complete");
    expect(result.finalReport).toBeDefined();
    expect(typeof result.overallScore).toBe("number");
  }, 120000);
});
