import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { GitService } from "../../app/services/git.service.js";

vi.mock("axios");

describe("GitService", () => {
  let git: GitService;

  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
    process.env.GITHUB_TOKEN = "test-token";
    git = new GitService();
  });

  it("throws on invalid PR URL", async () => {
    await expect(git.getPRDiff("https://invalid.com/foo")).rejects.toThrow(
      "Invalid PR URL"
    );
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("fetches diff and files from GitHub API", async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: "diff content" })
      .mockResolvedValueOnce({
        data: [{ filename: "src/foo.ts" }, { filename: "src/bar.ts" }],
      });

    const result = await git.getPRDiff(
      "https://github.com/owner/repo/pull/123"
    );

    expect(result).toEqual({
      diff: "diff content",
      files: ["src/foo.ts", "src/bar.ts"],
    });
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
