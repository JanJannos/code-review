import { ReviewState, Finding } from "../graph/state";
import { KnowledgeBaseService } from "../services/knowledge-base.service";
import { DIFF_LIMITS } from "../config";
import { chatModelFast } from "../llm/chat-model";
import { v4 as uuid } from "uuid";

const parseFindings = (raw: string): Omit<Finding, "id" | "agent">[] => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const architectureNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  console.log("[architecture] LLM call...");
  const kb = new KnowledgeBaseService();
  const relevantADRs = await kb.search(state.diff.slice(0, DIFF_LIMITS.ADR_SEARCH));

  const prompt = `
You are a software architect. Review this pull request for architectural issues.
Check for: SOLID violations, god classes, inappropriate layer coupling, circular dependencies,
missing abstractions, deviations from the ADRs below.

RELEVANT ARCHITECTURE DECISION RECORDS:
${relevantADRs}

DIFF:
${state.diff.slice(0, DIFF_LIMITS.DEFAULT)}

Return ONLY a JSON array of findings with: severity, file, line, title, description, suggestion.
`;

  const response = await chatModelFast.invoke(prompt);
  const raw = (response.content as string) ?? "[]";
  const parsed = parseFindings(raw);

  const architectureFindings: Finding[] = parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent: "architecture",
  }));

  console.log(`[architecture] Done. ${architectureFindings.length} findings.`);
  return { architectureFindings };
};
