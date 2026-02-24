import { ReviewState } from "../graph/state";
import { GitService } from "../services/git.service";
import { inferLanguageFromFiles } from "../closures";

export const orchestratorNode = async (state: ReviewState): Promise<Partial<ReviewState>> => {
  console.log("[orchestrator] Fetching diff and files...");
  const git = new GitService();
  const { diff, files } = await git.getPRDiff(state.prUrl);
  console.log(`[orchestrator] Done. ${files.length} files, ${diff.length} chars.`);

  return {
    diff,
    files,
    language: inferLanguageFromFiles(files),
    status: "running",
  };
};
