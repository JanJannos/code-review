import { ReviewState, Finding } from "../graph/state";
import { DIFF_LIMITS } from "../config";
import { chatModelLarge } from "../llm/chat-model";
import { v4 as uuid } from "uuid";

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
  console.log("[security] LLM call...");
  const prompt = `
You are a senior application security engineer. Analyze this pull request diff for security vulnerabilities.
Focus on: OWASP Top 10, hardcoded secrets, injection attacks, broken auth, improper input validation,
unsafe deserialization, eval() misuse, SQL injection, XSS.

DIFF:
${state.diff.slice(0, DIFF_LIMITS.DEFAULT)}

Return ONLY a JSON array of findings with: severity, file, line, title, description, suggestion.
Be conservative — only report real issues with clear evidence.
`;

  const response = await chatModelLarge.invoke(prompt);
  const raw = (response.content as string) ?? "[]";
  const parsed = parseFindings(raw);

  const securityFindings: Finding[] = parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent: "security",
  }));

  console.log(`[security] Done. ${securityFindings.length} findings.`);
  return { securityFindings };
}
