import { ChatAnthropic } from "@langchain/anthropic";
import { ReviewState, Finding } from "../graph/state.js";
import { MODELS, DIFF_LIMITS } from "../constants.js";
import { v4 as uuid } from "uuid";

const model = new ChatAnthropic({
  model: MODELS.HAIKU,
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

export async function documentationNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const prompt = `
You are a documentation expert. Review this pull request for documentation gaps.
Check for: missing JSDoc/TSDoc on exported functions/classes, missing @param/@returns,
outdated comments that no longer match code, missing README updates for behavior changes,
unexplained complex algorithms.

DIFF:
${state.diff.slice(0, DIFF_LIMITS.DEFAULT)}

Return ONLY a JSON array of findings with: severity, file, line, title, description, suggestion.
`;

  const response = await model.invoke([{ role: "user", content: prompt }]);
  const raw = (response.content as string) ?? "[]";
  const parsed = parseFindings(raw);

  const docFindings: Finding[] = parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent: "documentation",
  }));

  return { docFindings };
}
