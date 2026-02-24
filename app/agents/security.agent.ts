import { ReviewState, Finding } from "../graph/state";
import { DIFF_LIMITS } from "../config";
import { chatModelLarge } from "../llm/chat-model";
import { parseFindings, makeFindingsWithAgent } from "../closures";

const toSecurityFindings = makeFindingsWithAgent("security");

export const securityNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
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
  const securityFindings: Finding[] = toSecurityFindings(parseFindings(raw));

  console.log(`[security] Done. ${securityFindings.length} findings.`);
  return { securityFindings };
};
