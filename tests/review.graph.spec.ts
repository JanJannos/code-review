import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../app/agents/orchestrator.agent", () => ({
  orchestratorNode: vi.fn(),
}));
vi.mock("../app/agents/security.agent", () => ({
  securityNode: vi.fn(),
}));
vi.mock("../app/agents/architecture.agent", () => ({
  architectureNode: vi.fn(),
}));
vi.mock("../app/agents/test-quality.agent", () => ({
  testQualityNode: vi.fn(),
}));
vi.mock("../app/agents/documentation.agent", () => ({
  documentationNode: vi.fn(),
}));
vi.mock("../app/agents/aggregator.agent", () => ({
  aggregatorNode: vi.fn(),
}));

describe("buildReviewGraph", () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it("compiles without error", async () => {
    const { buildReviewGraph } = await import("../app/graph/review.graph");
    const graph = buildReviewGraph();
    expect(graph).toBeDefined();
    expect(typeof graph.invoke).toBe("function");
  });
});
