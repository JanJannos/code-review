import { StateGraph, END, START } from "@langchain/langgraph";
import { ReviewStateAnnotation } from "./state.js";
import { orchestratorNode } from "../agents/orchestrator.agent.js";
import { staticAnalysisNode } from "../agents/static-analysis.agent.js";
import { securityNode } from "../agents/security.agent.js";
import { architectureNode } from "../agents/architecture.agent.js";
import { testQualityNode } from "../agents/test-quality.agent.js";
import { documentationNode } from "../agents/documentation.agent.js";
import { aggregatorNode } from "../agents/aggregator.agent.js";

export function buildReviewGraph() {
  const graph = new StateGraph(ReviewStateAnnotation)
    .addNode("orchestrator", orchestratorNode)
    .addNode("static_analysis", staticAnalysisNode)
    .addNode("security", securityNode)
    .addNode("architecture", architectureNode)
    .addNode("test_quality", testQualityNode)
    .addNode("documentation", documentationNode)
    .addNode("aggregator", aggregatorNode)
    .addEdge(START, "orchestrator")
    .addEdge("orchestrator", "static_analysis")
    .addEdge("orchestrator", "security")
    .addEdge("orchestrator", "architecture")
    .addEdge("orchestrator", "test_quality")
    .addEdge("orchestrator", "documentation")
    .addEdge("static_analysis", "aggregator")
    .addEdge("security", "aggregator")
    .addEdge("architecture", "aggregator")
    .addEdge("test_quality", "aggregator")
    .addEdge("documentation", "aggregator")
    .addEdge("aggregator", END);

  return graph.compile();
}
