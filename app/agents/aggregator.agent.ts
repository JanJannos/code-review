import { ChatAnthropic } from "@langchain/anthropic";
import { ReviewState, Finding } from "../graph/state.js";
import { NotificationService } from "../services/notification.service.js";
import { ReportService } from "../services/report.service.js";
import { MODELS, SEVERITY_SCORE } from "../constants.js";

const model = new ChatAnthropic({
  model: MODELS.SONNET,
  temperature: 0,
});

function deduplicateFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = `${f.file}:${f.line ?? ""}:${f.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function aggregatorNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const allFindings = deduplicateFindings([
    ...state.staticFindings,
    ...state.securityFindings,
    ...state.architectureFindings,
    ...state.testFindings,
    ...state.docFindings,
  ]);

  const totalScore = allFindings.reduce(
    (sum, f) => sum + SEVERITY_SCORE[f.severity],
    0
  );
  const overallScore = Math.max(0, 100 - totalScore);

  const prompt = `
You are a senior engineering lead composing a final code review.
Synthesize these findings into a clear, constructive review report in Markdown.
Group by file. Lead with critical/high severity. Be direct but kind.
End with an overall assessment and score of ${overallScore}/100.

FINDINGS:
${JSON.stringify(allFindings, null, 2)}
`;

  const response = await model.invoke([{ role: "user", content: prompt }]);
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

  return { finalReport, overallScore, status: "complete" };
}
