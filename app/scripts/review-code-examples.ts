import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(projectRoot, ".env") });

const main = async () => {
  if (!process.env.GROQ_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.error("GROQ_API_KEY or ANTHROPIC_API_KEY required. Set in .env or run:");
    console.error("  GROQ_API_KEY=gsk_... npm run review:examples");
    process.exit(1);
  }

  console.log("Running review on code-examples/...\n");
  console.log(
    "Note: This runs 5 LLM calls (4 specialists + aggregator). Each is a network round-trip to the API (~5–15s). Expect 25–75s total.\n"
  );
  const { buildReviewGraph } = await import("../graph/review.graph");
  const graph = buildReviewGraph();
  const result = await graph.invoke({
    prUrl: "local://code-examples",
    prNumber: 1,
    repo: "local/code-examples",
    diff: "",
    files: [],
    language: "",
    securityFindings: [],
    architectureFindings: [],
    testFindings: [],
    docFindings: [],
    status: "pending",
  });

  console.log("\n--- REVIEW REPORT ---\n");
  console.log(result.finalReport ?? "");
  console.log("\n--- SCORE:", result.overallScore ?? "N/A", "/ 100 ---");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
