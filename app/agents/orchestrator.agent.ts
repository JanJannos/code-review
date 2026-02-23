import { ReviewState } from "../graph/state.js";
import { GitService } from "../services/git.service.js";

export async function orchestratorNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const git = new GitService();
  const { diff, files } = await git.getPRDiff(state.prUrl);

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
