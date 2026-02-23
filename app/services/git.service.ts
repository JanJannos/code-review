import axios from "axios";
import { loadCodeExamples } from "./local-files.service";

export class GitService {
  private token = process.env.GITHUB_TOKEN ?? "";

  async getPRDiff(prUrl: string): Promise<{ diff: string; files: string[] }> {
    if (prUrl === "local://code-examples") {
      return loadCodeExamples();
    }
    const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) throw new Error("Invalid PR URL");
    const [, owner, repo, number] = match;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3.diff",
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const diffRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
      { headers }
    );

    const filesRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files`,
      { headers: { ...headers, Accept: "application/vnd.github.v3+json" } }
    );

    return {
      diff: diffRes.data,
      files: (filesRes.data as { filename: string }[]).map((f) => f.filename),
    };
  }
}
