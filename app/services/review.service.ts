import { buildReviewGraph } from "../graph/review.graph";

export interface ReviewResult {
  finalReport: string;
  overallScore: number;
  status: string;
}

const initialPayload = {
  diff: "",
  files: [] as string[],
  language: "",
  securityFindings: [],
  architectureFindings: [],
  testFindings: [],
  docFindings: [],
  status: "pending" as const,
};

export class ReviewService {
  async runLocal(): Promise<ReviewResult> {
    const graph = buildReviewGraph();
    const result = await graph.invoke({
      prUrl: "local://code-examples",
      prNumber: 1,
      repo: "local/code-examples",
      ...initialPayload,
    });
    return {
      finalReport: result.finalReport ?? "",
      overallScore: result.overallScore ?? 0,
      status: result.status ?? "complete",
    };
  }

  async runForPR(prUrl: string, prNumber: number, repo: string): Promise<void> {
    const graph = buildReviewGraph();
    await graph.invoke({
      prUrl,
      prNumber,
      repo,
      ...initialPayload,
    });
  }
}
