import path from "path";
import { ReviewState } from "../graph/state";
import { NotificationService } from "../services/notification.service";
import { ReportService } from "../services/report.service";
import { SEVERITY_SCORE } from "../config";
import { chatModelFast } from "../llm/chat-model";
import { deduplicateFindings, createOverallScore } from "../closures";

const getOverallScore = createOverallScore(SEVERITY_SCORE);

export const aggregatorNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  const allFindings = deduplicateFindings([
    ...state.securityFindings,
    ...state.architectureFindings,
    ...state.testFindings,
    ...state.docFindings,
  ]);

  const overallScore = getOverallScore(allFindings);

  const reviewedFiles = state.files.map((f) => path.basename(f));

  const prompt = `
You are a senior engineering lead composing a final code review.
Synthesize these findings into a clear, constructive review report in Markdown.

REQUIRED: List every file in REVIEWED FILES below. For each file, either show its findings or write "No findings."
Group by file. Lead with critical/high severity. Be direct but kind.
End with an overall assessment and score of ${overallScore}/100.

REVIEWED FILES (must include all):
${reviewedFiles.join("\n")}

FINDINGS:
${JSON.stringify(allFindings, null, 2)}
`;

  const response = await chatModelFast.invoke(prompt);
  const finalReport = (response.content as string) ?? "";

  const notifier = new NotificationService();
  await notifier.postPRComment(state.prUrl, finalReport);

  const reporter = new ReportService();
  await reporter.save({
    prUrl: state.prUrl,
    findings: allFindings,
    score: overallScore,
    markdown: finalReport,
  });

  console.log(`[aggregator] Done. Score: ${overallScore}/100.`);
  return { finalReport, overallScore, status: "complete" };
};
