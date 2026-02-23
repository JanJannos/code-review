import { ChatAnthropic } from "@langchain/anthropic";
import { ReviewState, Finding } from "../graph/state.js";
import { SemgrepService } from "../services/semgrep.service.js";
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

export async function securityNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const semgrep = new SemgrepService();
  const semgrepResults = await semgrep.scan(state.files);

  const prompt = `
You are a senior application security engineer. Analyze this pull request diff and Semgrep findings
for security vulnerabilities. Focus on: OWASP Top 10, hardcoded secrets, injection attacks,
broken auth, insecure dependencies, improper input validation, unsafe deserialization.

SEMGREP FINDINGS:
${JSON.stringify(semgrepResults, null, 2)}

DIFF:
${state.diff.slice(0, DIFF_LIMITS.DEFAULT)}

Return ONLY a JSON array of findings with: severity, file, line, title, description, suggestion.
Be conservative — only report real issues with clear evidence.
`;

  const response = await model.invoke([{ role: "user", content: prompt }]);
  const raw = (response.content as string) ?? "[]";
  const parsed = parseFindings(raw);

  const securityFindings: Finding[] = parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent: "security",
  }));

  return { securityFindings };
}
