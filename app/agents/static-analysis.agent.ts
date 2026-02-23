import { ChatAnthropic } from "@langchain/anthropic";
import { ReviewState, Finding } from "../graph/state.js";
import { LinterService } from "../services/linter.service.js";
import { ASTService } from "../services/ast.service.js";
import { MODELS, DIFF_LIMITS } from "../constants.js";
import { v4 as uuid } from "uuid";

const model = new ChatAnthropic({
  model: MODELS.SONNET,
  temperature: 0,
});

function parseFindings(raw: string): Omit<Finding, "id" | "agent">[] {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function staticAnalysisNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const linter = new LinterService();
  const ast = new ASTService();

  const lintResults = await linter.run(state.files);
  const complexityResults = await ast.analyzeComplexity(state.files);

  const prompt = `
You are a static analysis expert. Review the following lint results and complexity metrics for a pull request.
Return a JSON array of findings. Each finding must have: severity, file, line, title, description, suggestion.

LINT RESULTS:
${JSON.stringify(lintResults, null, 2)}

COMPLEXITY METRICS:
${JSON.stringify(complexityResults, null, 2)}

DIFF:
${state.diff.slice(0, DIFF_LIMITS.STATIC)}

Respond ONLY with a valid JSON array.
`;

  const response = await model.invoke([{ role: "user", content: prompt }]);
  const raw = (response.content as string) ?? "[]";
  const parsed = parseFindings(raw);

  const staticFindings: Finding[] = parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent: "static_analysis",
  }));

  return { staticFindings };
}
