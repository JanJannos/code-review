import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { GitService } from "../services/git.service";

export const fetchPRTool = tool(
  async ({ prUrl }) => {
    const git = new GitService();
    return await git.getPRDiff(prUrl);
  },
  {
    name: "fetch_pr",
    description: "Fetch PR diff and file list from GitHub",
    schema: z.object({ prUrl: z.string().describe("Full PR URL") }),
  }
);
