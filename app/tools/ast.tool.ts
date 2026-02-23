import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ASTService } from "../services/ast.service.js";

export const astTool = tool(
  async ({ files }) => {
    const ast = new ASTService();
    return await ast.analyzeComplexity(files);
  },
  {
    name: "ast_complexity",
    description: "Analyze cyclomatic complexity via AST",
    schema: z.object({ files: z.array(z.string()).describe("File paths to analyze") }),
  }
);
