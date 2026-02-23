import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { LinterService } from "../services/linter.service.js";

export const lintTool = tool(
  async ({ files }) => {
    const linter = new LinterService();
    return await linter.run(files);
  },
  {
    name: "lint",
    description: "Run ESLint on files",
    schema: z.object({ files: z.array(z.string()).describe("File paths to lint") }),
  }
);
