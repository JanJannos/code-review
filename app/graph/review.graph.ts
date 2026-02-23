import { StateGraph, END, START } from "@langchain/langgraph";
import { ReviewStateAnnotation } from "./state";
import { orchestratorNode } from "../agents/orchestrator.agent";
import { securityNode } from "../agents/security.agent";
import { architectureNode } from "../agents/architecture.agent";
import { testQualityNode } from "../agents/test-quality.agent";
import { documentationNode } from "../agents/documentation.agent";
import { aggregatorNode } from "../agents/aggregator.agent";

export const buildReviewGraph = () => {
  const graph = new StateGraph(ReviewStateAnnotation)
    .addNode("orchestrator", orchestratorNode)
    .addNode("security", securityNode)
    .addNode("architecture", architectureNode)
    .addNode("test_quality", testQualityNode)
    .addNode("documentation", documentationNode)
    .addNode("aggregator", aggregatorNode)
    .addEdge(START, "orchestrator")
    .addEdge("orchestrator", "security")
    .addEdge("orchestrator", "architecture")
    .addEdge("orchestrator", "test_quality")
    .addEdge("orchestrator", "documentation")
    .addEdge("security", "aggregator")
    .addEdge("architecture", "aggregator")
    .addEdge("test_quality", "aggregator")
    .addEdge("documentation", "aggregator")
    .addEdge("aggregator", END);

  return graph.compile();
};
