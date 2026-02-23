import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { SemgrepService } from "../services/semgrep.service.js";

export const semgrepTool = tool(
  async ({ files }) => {
    const semgrep = new SemgrepService();
    return await semgrep.scan(files);
  },
  {
    name: "semgrep_scan",
    description: "Run Semgrep security scan on files",
    schema: z.object({ files: z.array(z.string()).describe("File paths to scan") }),
  }
);
