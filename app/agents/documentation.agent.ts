import { ReviewState, Finding } from "../graph/state";
import { DIFF_LIMITS } from "../config";
import { chatModelFast } from "../llm/chat-model";
import { parseFindings, makeFindingsWithAgent } from "../closures";

const toDocFindings = makeFindingsWithAgent("documentation");

export const documentationNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  console.log("[documentation] LLM call...");
  const prompt = `
You are a documentation expert. Review this pull request for documentation gaps.
Check for: missing JSDoc/TSDoc on exported functions/classes, missing @param/@returns,
outdated comments that no longer match code, missing README updates for behavior changes,
unexplained complex algorithms.

DIFF:
${state.diff.slice(0, DIFF_LIMITS.DEFAULT)}

Return ONLY a JSON array of findings with: severity, file, line, title, description, suggestion.
`;

  const response = await chatModelFast.invoke(prompt);
  const raw = (response.content as string) ?? "[]";
  const docFindings: Finding[] = toDocFindings(parseFindings(raw));

  console.log(`[documentation] Done. ${docFindings.length} findings.`);
  return { docFindings };
};
