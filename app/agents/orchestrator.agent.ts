import { ReviewState } from "../graph/state";
import { GitService } from "../services/git.service";

export async function orchestratorNode(state: ReviewState): Promise<Partial<ReviewState>> {
  console.log("[orchestrator] Fetching diff and files...");
  const git = new GitService();
  const { diff, files } = await git.getPRDiff(state.prUrl);
  console.log(`[orchestrator] Done. ${files.length} files, ${diff.length} chars.`);

  const ext = files[0]?.split(".").pop() ?? "ts";
  const langMap: Record<string, string> = {
    ts: "TypeScript",
    js: "JavaScript",
    py: "Python",
    go: "Go",
    java: "Java",
    cs: "C#",
  };

  return {
    diff,
    files,
    language: langMap[ext] ?? "Unknown",
    status: "running",
  };
}
