import { ReviewState, Finding } from "../graph/state";
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

export const testQualityNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  const testFiles = state.files.filter(
    (f) =>
      f.includes(".test.") || f.includes(".spec.") || f.includes("__tests__")
  );

  const prompt = `
You are a testing expert. Review the test files and diff for quality issues.
Check for: missing edge cases, poor assertions (toBeTruthy instead of specific matchers),
missing error path tests, test interdependencies, missing mocks, untested new code paths.

TEST FILES CHANGED: ${testFiles.join(", ") || "None"}

DIFF:
${state.diff.slice(0, DIFF_LIMITS.DEFAULT)}

Return ONLY a JSON array of findings with: severity, file, line, title, description, suggestion.
`;

  const response = await chatModelFast.invoke(prompt);
  const raw = (response.content as string) ?? "[]";
  const parsed = parseFindings(raw);

  const testFindings: Finding[] = parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent: "test_quality",
  }));

  console.log(`[test_quality] Done. ${testFindings.length} findings.`);
  return { testFindings };
};
