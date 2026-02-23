# AI Code Review Agent Network — Node.js / TypeScript
## Complete Copy-Paste Reference Sheet

---

## 1. FRAMEWORK & STACK

| Layer | Choice |
|---|---|
| Agent Orchestration | `@langchain/langgraph` |
| LLM Provider | `@anthropic/sdk` via `@langchain/anthropic` |
| Schema Validation | `zod` |
| API Layer | `express` |
| Vector Store | `@pinecone-database/pinecone` |
| Cache | `ioredis` |
| AST Parsing | `tree-sitter` + `tree-sitter-typescript` |
| Security Scanning | `semgrep` (CLI subprocess) |
| Linting | `eslint` (programmatic API) |
| Queue | `bullmq` (Redis-backed) |

---

## 2. INSTALL — COPY PASTE

```bash
npm init -y
npm install @langchain/langgraph @langchain/anthropic @langchain/core \
  @anthropic/sdk zod express ioredis bullmq \
  @pinecone-database/pinecone tree-sitter tree-sitter-typescript \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  axios dotenv uuid

npm install -D typescript ts-node tsx @types/node @types/express \
  @types/uuid nodemon

npx tsc --init
```

---

## 3. PROJECT STRUCTURE

```
src/
├── index.ts                          ← Entry point (Express server)
├── graph/
│   ├── review.graph.ts               ← LangGraph state machine definition
│   └── state.ts                      ← Shared Zod state schema
├── agents/
│   ├── orchestrator.agent.ts         ← Supervisor / router
│   ├── static-analysis.agent.ts      ← ESLint + AST complexity
│   ├── security.agent.ts             ← Semgrep + Claude security reasoning
│   ├── architecture.agent.ts         ← SOLID, coupling, ADR checks
│   ├── test-quality.agent.ts         ← Test coverage + assertion quality
│   ├── documentation.agent.ts        ← JSDoc/TSDoc completeness
│   └── aggregator.agent.ts           ← Merge, dedupe, score, report
├── services/
│   ├── git.service.ts                ← GitHub/GitLab REST API
│   ├── embedding.service.ts          ← Pinecone vector store
│   ├── linter.service.ts             ← ESLint programmatic runner
│   ├── ast.service.ts                ← Tree-sitter parser + metrics
│   ├── semgrep.service.ts            ← Semgrep CLI subprocess
│   ├── knowledge-base.service.ts     ← ADR + past review vector store
│   ├── notification.service.ts       ← GitHub PR comments + Slack
│   ├── report.service.ts             ← JSON/MD/HTML report renderer
│   ├── cache.service.ts              ← Redis cache
│   └── auth.service.ts               ← OAuth token manager
├── tools/                            ← LangChain tools wrapping services
│   ├── fetch-pr.tool.ts
│   ├── lint.tool.ts
│   ├── ast.tool.ts
│   ├── semgrep.tool.ts
│   └── search-codebase.tool.ts
└── api/
    └── webhook.controller.ts         ← POST /webhook/github
```

---

## 4. SHARED STATE SCHEMA — `src/graph/state.ts`

```typescript
import { z } from "zod";
import { Annotation } from "@langchain/langgraph";

export const FindingSchema = z.object({
  id: z.string(),
  agent: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  file: z.string(),
  line: z.number().optional(),
  title: z.string(),
  description: z.string(),
  suggestion: z.string().optional(),
});

export type Finding = z.infer<typeof FindingSchema>;

export const ReviewStateAnnotation = Annotation.Root({
  prUrl: Annotation<string>(),
  prNumber: Annotation<number>(),
  repo: Annotation<string>(),
  diff: Annotation<string>(),
  files: Annotation<string[]>(),
  language: Annotation<string>(),
  staticFindings: Annotation<Finding[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  securityFindings: Annotation<Finding[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  architectureFindings: Annotation<Finding[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  testFindings: Annotation<Finding[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  docFindings: Annotation<Finding[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  finalReport: Annotation<string>(),
  overallScore: Annotation<number>(),
  status: Annotation<"pending" | "running" | "complete" | "failed">(),
  error: Annotation<string | undefined>(),
});

export type ReviewState = typeof ReviewStateAnnotation.State;
```

---

## 5. THE GRAPH — `src/graph/review.graph.ts`

```typescript
import { StateGraph, END, START } from "@langchain/langgraph";
import { ReviewStateAnnotation } from "./state";
import { orchestratorNode } from "../agents/orchestrator.agent";
import { staticAnalysisNode } from "../agents/static-analysis.agent";
import { securityNode } from "../agents/security.agent";
import { architectureNode } from "../agents/architecture.agent";
import { testQualityNode } from "../agents/test-quality.agent";
import { documentationNode } from "../agents/documentation.agent";
import { aggregatorNode } from "../agents/aggregator.agent";

export function buildReviewGraph() {
  const graph = new StateGraph(ReviewStateAnnotation)
    // Nodes
    .addNode("orchestrator", orchestratorNode)
    .addNode("static_analysis", staticAnalysisNode)
    .addNode("security", securityNode)
    .addNode("architecture", architectureNode)
    .addNode("test_quality", testQualityNode)
    .addNode("documentation", documentationNode)
    .addNode("aggregator", aggregatorNode)

    // Entry
    .addEdge(START, "orchestrator")

    // Fan-out: orchestrator → all specialists in parallel
    .addEdge("orchestrator", "static_analysis")
    .addEdge("orchestrator", "security")
    .addEdge("orchestrator", "architecture")
    .addEdge("orchestrator", "test_quality")
    .addEdge("orchestrator", "documentation")

    // Fan-in: all specialists → aggregator
    .addEdge("static_analysis", "aggregator")
    .addEdge("security", "aggregator")
    .addEdge("architecture", "aggregator")
    .addEdge("test_quality", "aggregator")
    .addEdge("documentation", "aggregator")

    // End
    .addEdge("aggregator", END);

  return graph.compile();
}
```

---

## 6. AGENTS

### 6a. Orchestrator — `src/agents/orchestrator.agent.ts`

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { ReviewState } from "../graph/state";
import { GitService } from "../services/git.service";

const model = new ChatAnthropic({
  model: "claude-opus-4-6",
  temperature: 0,
});

export async function orchestratorNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const git = new GitService();
  const { diff, files } = await git.getPRDiff(state.prUrl);

  // Detect primary language from file extensions
  const ext = files[0]?.split(".").pop() ?? "ts";
  const langMap: Record<string, string> = {
    ts: "TypeScript", js: "JavaScript", py: "Python",
    go: "Go", java: "Java", cs: "C#",
  };

  return {
    diff,
    files,
    language: langMap[ext] ?? "Unknown",
    status: "running",
  };
}
```

---

### 6b. Static Analysis — `src/agents/static-analysis.agent.ts`

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { ReviewState, Finding } from "../graph/state";
import { LinterService } from "../services/linter.service";
import { ASTService } from "../services/ast.service";
import { v4 as uuid } from "uuid";

const model = new ChatAnthropic({ model: "claude-haiku-4-5-20251001", temperature: 0 });

export async function staticAnalysisNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const linter = new LinterService();
  const ast = new ASTService();

  const lintResults = await linter.run(state.files);
  const complexityResults = await ast.analyzeComplexity(state.files);

  const prompt = `
You are a static analysis expert. Review the following lint results and complexity metrics for a pull request.
Return a JSON array of findings. Each finding must have: severity, file, line, title, description, suggestion.

LINT RESULTS:
${JSON.stringify(lintResults, null, 2)}

COMPLEXITY METRICS:
${JSON.stringify(complexityResults, null, 2)}

DIFF:
${state.diff.slice(0, 8000)}

Respond ONLY with a valid JSON array.
  `;

  const response = await model.invoke([{ role: "user", content: prompt }]);
  const raw = (response.content as string).replace(/```json|```/g, "").trim();
  const parsed: Omit<Finding, "id" | "agent">[] = JSON.parse(raw);

  const staticFindings: Finding[] = parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent: "static_analysis",
  }));

  return { staticFindings };
}
```

---

### 6c. Security — `src/agents/security.agent.ts`

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { ReviewState, Finding } from "../graph/state";
import { SemgrepService } from "../services/semgrep.service";
import { v4 as uuid } from "uuid";

const model = new ChatAnthropic({ model: "claude-opus-4-6", temperature: 0 });

export async function securityNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const semgrep = new SemgrepService();
  const semgrepResults = await semgrep.scan(state.files);

  const prompt = `
You are a senior application security engineer. Analyze this pull request diff and Semgrep findings
for security vulnerabilities. Focus on: OWASP Top 10, hardcoded secrets, injection attacks,
broken auth, insecure dependencies, improper input validation, unsafe deserialization.

SEMGREP FINDINGS:
${JSON.stringify(semgrepResults, null, 2)}

DIFF:
${state.diff.slice(0, 10000)}

Return ONLY a JSON array of findings with: severity, file, line, title, description, suggestion.
Be conservative — only report real issues with clear evidence.
  `;

  const response = await model.invoke([{ role: "user", content: prompt }]);
  const raw = (response.content as string).replace(/```json|```/g, "").trim();
  const parsed: Omit<Finding, "id" | "agent">[] = JSON.parse(raw);

  const securityFindings: Finding[] = parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent: "security",
  }));

  return { securityFindings };
}
```

---

### 6d. Architecture — `src/agents/architecture.agent.ts`

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { ReviewState, Finding } from "../graph/state";
import { KnowledgeBaseService } from "../services/knowledge-base.service";
import { v4 as uuid } from "uuid";

const model = new ChatAnthropic({ model: "claude-opus-4-6", temperature: 0 });

export async function architectureNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const kb = new KnowledgeBaseService();
  const relevantADRs = await kb.search(state.diff.slice(0, 2000));

  const prompt = `
You are a software architect. Review this pull request for architectural issues.
Check for: SOLID violations, god classes, inappropriate layer coupling, circular dependencies,
missing abstractions, deviations from the ADRs below.

RELEVANT ARCHITECTURE DECISION RECORDS:
${relevantADRs}

DIFF:
${state.diff.slice(0, 10000)}

Return ONLY a JSON array of findings with: severity, file, line, title, description, suggestion.
  `;

  const response = await model.invoke([{ role: "user", content: prompt }]);
  const raw = (response.content as string).replace(/```json|```/g, "").trim();
  const parsed: Omit<Finding, "id" | "agent">[] = JSON.parse(raw);

  const architectureFindings: Finding[] = parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent: "architecture",
  }));

  return { architectureFindings };
}
```

---

### 6e. Test Quality — `src/agents/test-quality.agent.ts`

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { ReviewState, Finding } from "../graph/state";
import { v4 as uuid } from "uuid";

const model = new ChatAnthropic({ model: "claude-haiku-4-5-20251001", temperature: 0 });

export async function testQualityNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const testFiles = state.files.filter((f) =>
    f.includes(".test.") || f.includes(".spec.") || f.includes("__tests__")
  );

  const prompt = `
You are a testing expert. Review the test files and diff for quality issues.
Check for: missing edge cases, poor assertions (toBeTruthy instead of specific matchers),
missing error path tests, test interdependencies, missing mocks, untested new code paths.

TEST FILES CHANGED: ${testFiles.join(", ")}

DIFF:
${state.diff.slice(0, 10000)}

Return ONLY a JSON array of findings with: severity, file, line, title, description, suggestion.
  `;

  const response = await model.invoke([{ role: "user", content: prompt }]);
  const raw = (response.content as string).replace(/```json|```/g, "").trim();
  const parsed: Omit<Finding, "id" | "agent">[] = JSON.parse(raw);

  const testFindings: Finding[] = parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent: "test_quality",
  }));

  return { testFindings };
}
```

---

### 6f. Documentation — `src/agents/documentation.agent.ts`

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { ReviewState, Finding } from "../graph/state";
import { v4 as uuid } from "uuid";

const model = new ChatAnthropic({ model: "claude-haiku-4-5-20251001", temperature: 0 });

export async function documentationNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const prompt = `
You are a documentation expert. Review this pull request for documentation gaps.
Check for: missing JSDoc/TSDoc on exported functions/classes, missing @param/@returns,
outdated comments that no longer match code, missing README updates for behavior changes,
unexplained complex algorithms.

DIFF:
${state.diff.slice(0, 10000)}

Return ONLY a JSON array of findings with: severity, file, line, title, description, suggestion.
  `;

  const response = await model.invoke([{ role: "user", content: prompt }]);
  const raw = (response.content as string).replace(/```json|```/g, "").trim();
  const parsed: Omit<Finding, "id" | "agent">[] = JSON.parse(raw);

  const docFindings: Finding[] = parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent: "documentation",
  }));

  return { docFindings };
}
```

---

### 6g. Aggregator — `src/agents/aggregator.agent.ts`

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { ReviewState, Finding } from "../graph/state";
import { NotificationService } from "../services/notification.service";
import { ReportService } from "../services/report.service";

const model = new ChatAnthropic({ model: "claude-opus-4-6", temperature: 0 });

const SEVERITY_SCORE: Record<Finding["severity"], number> = {
  critical: 100, high: 50, medium: 20, low: 5, info: 1,
};

function deduplicateFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = `${f.file}:${f.line}:${f.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function aggregatorNode(state: ReviewState): Promise<Partial<ReviewState>> {
  const allFindings = deduplicateFindings([
    ...state.staticFindings,
    ...state.securityFindings,
    ...state.architectureFindings,
    ...state.testFindings,
    ...state.docFindings,
  ]);

  const totalScore = allFindings.reduce((sum, f) => sum + SEVERITY_SCORE[f.severity], 0);
  const overallScore = Math.max(0, 100 - totalScore);

  const prompt = `
You are a senior engineering lead composing a final code review.
Synthesize these findings into a clear, constructive review report in Markdown.
Group by file. Lead with critical/high severity. Be direct but kind.
End with an overall assessment and score of ${overallScore}/100.

FINDINGS:
${JSON.stringify(allFindings, null, 2)}
  `;

  const response = await model.invoke([{ role: "user", content: prompt }]);
  const finalReport = response.content as string;

  // Post to GitHub PR and Slack
  const notifier = new NotificationService();
  await notifier.postPRComment(state.prUrl, finalReport);

  // Save structured report
  const reporter = new ReportService();
  await reporter.save({ prUrl: state.prUrl, findings: allFindings, score: overallScore, markdown: finalReport });

  return { finalReport, overallScore, status: "complete" };
}
```

---

## 7. SERVICES (Skeletons)

### `src/services/git.service.ts`
```typescript
import axios from "axios";

export class GitService {
  private token = process.env.GITHUB_TOKEN!;

  async getPRDiff(prUrl: string): Promise<{ diff: string; files: string[] }> {
    // Parse owner/repo/number from prUrl
    const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) throw new Error("Invalid PR URL");
    const [, owner, repo, number] = match;

    const headers = { Authorization: `token ${this.token}`, Accept: "application/vnd.github.v3.diff" };

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
      files: filesRes.data.map((f: any) => f.filename),
    };
  }
}
```

### `src/services/linter.service.ts`
```typescript
import { ESLint } from "eslint";

export class LinterService {
  async run(files: string[]): Promise<ESLint.LintResult[]> {
    const eslint = new ESLint({ useEslintrc: true });
    const results = await eslint.lintFiles(files.filter((f) => f.match(/\.[tj]sx?$/)));
    return results;
  }
}
```

### `src/services/ast.service.ts`
```typescript
import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import fs from "fs/promises";

export class ASTService {
  async analyzeComplexity(files: string[]): Promise<Record<string, number>> {
    const parser = new Parser();
    parser.setLanguage(TypeScript.typescript);
    const results: Record<string, number> = {};

    for (const file of files.filter((f) => f.match(/\.tsx?$/))) {
      try {
        const source = await fs.readFile(file, "utf8");
        const tree = parser.parse(source);
        // Count branch nodes as rough cyclomatic complexity
        let complexity = 1;
        const cursor = tree.walk();
        do {
          if (["if_statement", "switch_case", "for_statement", "while_statement",
               "catch_clause", "conditional_expression"].includes(cursor.nodeType)) {
            complexity++;
          }
        } while (cursor.gotoNextSibling() || cursor.gotoParent());
        results[file] = complexity;
      } catch (_) {}
    }
    return results;
  }
}
```

### `src/services/semgrep.service.ts`
```typescript
import { execSync } from "child_process";

export class SemgrepService {
  async scan(files: string[]): Promise<unknown[]> {
    try {
      const fileList = files.join(" ");
      const output = execSync(
        `semgrep --config=auto --json ${fileList}`,
        { encoding: "utf8", timeout: 60000 }
      );
      return JSON.parse(output).results ?? [];
    } catch (e: any) {
      // semgrep exits non-zero when findings exist
      try { return JSON.parse(e.stdout ?? "{}").results ?? []; } catch { return []; }
    }
  }
}
```

### `src/services/cache.service.ts`
```typescript
import Redis from "ioredis";

export class CacheService {
  private client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

  async get<T>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    return val ? JSON.parse(val) : null;
  }

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }
}
```

### `src/services/notification.service.ts`
```typescript
import axios from "axios";

export class NotificationService {
  private token = process.env.GITHUB_TOKEN!;
  private slackWebhook = process.env.SLACK_WEBHOOK_URL;

  async postPRComment(prUrl: string, body: string): Promise<void> {
    const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) return;
    const [, owner, repo, number] = match;

    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues/${number}/comments`,
      { body },
      { headers: { Authorization: `token ${this.token}` } }
    );

    if (this.slackWebhook) {
      await axios.post(this.slackWebhook, {
        text: `Code review complete for ${prUrl}\n${body.slice(0, 500)}...`,
      });
    }
  }
}
```

### `src/services/report.service.ts`
```typescript
import fs from "fs/promises";
import path from "path";
import { Finding } from "../graph/state";

interface Report { prUrl: string; findings: Finding[]; score: number; markdown: string; }

export class ReportService {
  async save(report: Report): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dir = path.join(process.cwd(), "reports");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `review-${timestamp}.json`), JSON.stringify(report, null, 2));
    await fs.writeFile(path.join(dir, `review-${timestamp}.md`), report.markdown);
  }
}
```

---

## 8. WEBHOOK CONTROLLER — `src/api/webhook.controller.ts`

```typescript
import { Router, Request, Response } from "express";
import { buildReviewGraph } from "../graph/review.graph";

export const webhookRouter = Router();

webhookRouter.post("/github", async (req: Request, res: Response) => {
  const event = req.headers["x-github-event"];
  const payload = req.body;

  if (event !== "pull_request") return res.status(200).json({ ok: true });
  if (!["opened", "synchronize"].includes(payload.action)) return res.status(200).json({ ok: true });

  const prUrl = payload.pull_request.html_url;
  const prNumber = payload.pull_request.number;
  const repo = payload.repository.full_name;

  // Run async — respond immediately to GitHub
  res.status(202).json({ accepted: true });

  try {
    const graph = buildReviewGraph();
    await graph.invoke({
      prUrl,
      prNumber,
      repo,
      diff: "",
      files: [],
      language: "",
      staticFindings: [],
      securityFindings: [],
      architectureFindings: [],
      testFindings: [],
      docFindings: [],
      status: "pending",
    });
  } catch (err) {
    console.error("Graph execution failed:", err);
  }
});
```

---

## 9. ENTRY POINT — `src/index.ts`

```typescript
import express from "express";
import { webhookRouter } from "./api/webhook.controller";

const app = express();
app.use(express.json());
app.use("/webhook", webhookRouter);

// Health check
app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Code Review Agent running on port ${PORT}`));
```

---

## 10. ENV FILE — `.env`

```env
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_TOKEN=ghp_...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
REDIS_URL=redis://localhost:6379
PINECONE_API_KEY=...
PINECONE_INDEX=code-review
PORT=3000
```

---

## 11. TSCONFIG — `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 12. PACKAGE.JSON SCRIPTS

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts"
  }
}
```

---

## 13. AGENT SUMMARY TABLE

| Agent | Model | Responsibility |
|---|---|---|
| `OrchestratorAgent` | claude-opus-4-6 | Parse PR, detect language, fan out to specialists |
| `StaticAnalysisAgent` | claude-haiku-4-5 | ESLint + cyclomatic complexity via AST |
| `SecurityAgent` | claude-opus-4-6 | OWASP Top 10, secrets, injection via Semgrep + LLM |
| `ArchitectureAgent` | claude-opus-4-6 | SOLID, coupling, ADR compliance via RAG |
| `TestQualityAgent` | claude-haiku-4-5 | Coverage gaps, bad assertions, missing edge cases |
| `DocumentationAgent` | claude-haiku-4-5 | JSDoc/TSDoc completeness, stale comments |
| `AggregatorAgent` | claude-opus-4-6 | Merge, dedupe, score, post to GitHub + Slack |

---

## 14. SERVICE SUMMARY TABLE

| Service | Purpose |
|---|---|
| `GitService` | Fetch PR diffs and file list from GitHub REST API |
| `EmbeddingService` | Store/query code embeddings in Pinecone for RAG |
| `LinterService` | Run ESLint programmatically and return structured findings |
| `ASTService` | Parse code with Tree-sitter and compute complexity metrics |
| `SemgrepService` | Run Semgrep CLI and parse JSON security findings |
| `KnowledgeBaseService` | Vector search over ADRs and past review decisions |
| `NotificationService` | Post review comments to GitHub PR and Slack |
| `ReportService` | Save final report as JSON and Markdown to disk |
| `CacheService` | Redis-backed cache for diffs, ASTs, and embeddings |
| `AuthService` | OAuth token manager for VCS providers |

---

## 15. KEY DESIGN DECISIONS

**Parallel execution** — All 5 specialist agents fan out from the Orchestrator simultaneously using LangGraph's native parallel node support, minimizing total review latency.

**Model tiering** — Use `claude-opus-4-6` for agents requiring deep reasoning (Security, Architecture, Aggregator) and `claude-haiku-4-5-20251001` for pattern-matching agents (Static, Tests, Docs) to optimize cost and speed.

**Human-in-the-loop** — Add a LangGraph interrupt point before the Aggregator posts to the PR when `severity === "critical"`, allowing a senior engineer to approve the final output.

**Webhook-first** — The Express server listens for GitHub `pull_request` webhook events and returns HTTP 202 immediately, running the graph asynchronously to avoid GitHub's 10-second timeout.

**Stateful resumability** — Pass a Redis checkpointer to `graph.compile({ checkpointer })` to persist state between retries and support long-running reviews.
```typescript
import { RedisCheckpointer } from "@langchain/langgraph-checkpoint-redis";
const checkpointer = new RedisCheckpointer({ client: redisClient });
const graph = buildReviewGraph(checkpointer);
```
