import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../app/agents/orchestrator.agent.js", () => ({
  orchestratorNode: vi.fn(),
}));
vi.mock("../app/agents/static-analysis.agent.js", () => ({
  staticAnalysisNode: vi.fn(),
}));
vi.mock("../app/agents/security.agent.js", () => ({
  securityNode: vi.fn(),
}));
vi.mock("../app/agents/architecture.agent.js", () => ({
  architectureNode: vi.fn(),
}));
vi.mock("../app/agents/test-quality.agent.js", () => ({
  testQualityNode: vi.fn(),
}));
vi.mock("../app/agents/documentation.agent.js", () => ({
  documentationNode: vi.fn(),
}));
vi.mock("../app/agents/aggregator.agent.js", () => ({
  aggregatorNode: vi.fn(),
}));

describe("buildReviewGraph", () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it("compiles without error", async () => {
    const { buildReviewGraph } = await import("../app/graph/review.graph.js");
    const graph = buildReviewGraph();
    expect(graph).toBeDefined();
    expect(typeof graph.invoke).toBe("function");
  });
});
