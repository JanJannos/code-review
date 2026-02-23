import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { KnowledgeBaseService } from "../services/knowledge-base.service";

export const searchCodebaseTool = tool(
  async ({ query }) => {
    const kb = new KnowledgeBaseService();
    return await kb.search(query);
  },
  {
    name: "search_codebase",
    description: "Search ADRs and past review decisions",
    schema: z.object({ query: z.string().describe("Search query") }),
  }
);
