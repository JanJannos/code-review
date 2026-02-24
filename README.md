# Code Review Agent Network

AI-powered code review using LangGraph and Claude.

## Architecture

```
  ENTRY
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  ReviewService  (runLocal / runForPR)  ←  WebhookController, review:examples
  └───────────────────────────────────────┬─────────────────────────────────┘
                                          │ prUrl, initial state
                                          ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  GitService  ──► getPRDiff(prUrl)  ──►  diff, files                      │
  │  (or LocalFilesService when prUrl=local://code-examples)                  │
  │  AuthService  ──► GITHUB_TOKEN (for API)                                 │
  └───────────────────────────────────────┬─────────────────────────────────┘
                                          │
                                          ▼
  AGENTS (LangGraph)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         ┌─────────────────┐                             │
  │                         │  ORCHESTRATOR   │                             │
  │                         │  infers lang    │                             │
  │                         └────────┬────────┘                             │
  │                                  │ diff, files, language                │
  │         ┌────────────────────────┼────────────────────────┐             │
  │         ▼                        ▼                        ▼             │
  │  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
  │  │   SECURITY   │  │   ARCHITECTURE   │  │ TEST_QUALITY  │  │ DOCUMENTATION│
  │  │  LLM (large) │  │ KB.search() ─────┼──► KnowledgeBase │  │  LLM (fast)  │
  │  │  OWASP, etc. │  │ LLM (fast)       │  │  LLM (fast)   │  │  JSDoc, etc. │
  │  └──────┬───────┘  └────────┬─────────┘  └──────┬───────┘  └──────┬───────┘
  │         │                   │                    │                 │
  │         │ securityFindings  │ architectureFindings testFindings   │ docFindings
  │         └───────────────────┴──────────┬─────────┴─────────────────┘         │
  │                                        ▼                                     │
  │                             ┌─────────────────┐                             │
  │                             │   AGGREGATOR    │                             │
  │                             │ dedupe, score,  │                             │
  │                             │ LLM synthesis   │                             │
  │                             └────────┬────────┘                             │
  │                                      │ finalReport, overallScore            │
  │                                      ├──► NotificationService.postPRComment │
  │                                      │         (GitHub comment, Slack)     │
  │                                      └──► ReportService.save(report)        │
  └─────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
  OUTPUT: finalReport (Markdown), overallScore, status=complete

  OPTIONAL (not in graph; used by tools or future wiring)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  EmbeddingService (Pinecone)  ──► used by KnowledgeBaseService for ADRs  │
  │  CacheService (Redis)         ──► cache LLM/Semgrep results (callers)    │
  │  LinterService (ESLint)       ──► lint tool                              │
  │  ASTService (tree-sitter)     ──► ast tool                               │
  │  SemgrepService              ──► semgrep tool                            │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## Agents

| Agent | What it does | Why |
|-------|----------------|-----|
| **Orchestrator** | Fetches PR diff and file list (GitHub API or local `code-examples/`), infers language from file extension. | Single entry point so all specialists get the same diff and language; avoids each agent calling Git. |
| **Security** | LLM (large model) analyzes diff for OWASP Top 10, secrets, injection, auth, XSS, `eval()` misuse, SQL injection. Returns JSON findings. | Security needs deeper reasoning; large model reduces false negatives on subtle issues. |
| **Architecture** | Queries KnowledgeBase (ADRs) for context, then LLM checks SOLID, god classes, coupling, circular deps, ADR deviations. | Aligns reviews with documented architecture decisions. |
| **Test quality** | LLM reviews test files in the diff for weak assertions, missing edge/error cases, test coupling, untested paths. | Catches test smells that static tools often miss. |
| **Documentation** | LLM checks JSDoc/TSDoc, `@param`/`@returns`, stale comments, README gaps for behavior changes. | Keeps docs in sync with code without manual checklists. |
| **Aggregator** | Deduplicates findings, computes score from severity, runs LLM to synthesize one Markdown report, posts comment (GitHub/Slack), saves report via ReportService. | One coherent review and single notification instead of four separate comment threads. |

---

## Services

| Service | What it does | Why |
|---------|----------------|-----|
| **GitService** | Gets PR diff and file list from GitHub API (or returns local `code-examples/` when `prUrl` is `local://code-examples`). | Unifies “PR source” so orchestrator and notification work for both real PRs and local runs. |
| **LocalFilesService** | Reads `code-examples/` and builds a fake diff (git-style) and file list. | Enables full pipeline without a real PR for demos and `review:examples`. |
| **KnowledgeBaseService** | Searches ADRs (stub: returns a message unless Pinecone is configured). Intended to use EmbeddingService + Pinecone. | Feeds architecture agent with relevant ADRs for compliance. |
| **EmbeddingService** | Pinecone client: upsert vectors and query by vector. Used when KnowledgeBase is wired to Pinecone. | Vector search for “which ADRs relate to this diff” without loading all ADRs into the prompt. |
| **NotificationService** | Posts the final Markdown report as a GitHub PR comment and/or to a Slack webhook. | Delivers the review where the team works. |
| **ReportService** | Saves report payload (prUrl, findings, score, markdown). Current impl is no-op. | Placeholder for persisting reviews (DB, file, etc.). |
| **CacheService** | Redis get/set with JSON and TTL. Used by tools/callers that need to cache expensive results. | Avoids re-running LLM or Semgrep for identical inputs. |
| **LinterService** | Runs ESLint on JS/TS files with project config. Used by the lint tool. | Adds rule-based findings alongside LLM findings. |
| **ASTService** | Parses TS with tree-sitter and computes a simple complexity metric per file. Used by the AST tool. | Enables “complexity” as a signal for review or tooling. |
| **SemgrepService** | Runs `semgrep --config=auto` on supported files; returns JSON results. Used by the Semgrep tool. | Adds security/quality findings from Semgrep rules. |
| **ReviewService** | Builds the LangGraph and invokes it for `runLocal()` (code-examples) or `runForPR(prUrl, …)`. | Single API for “run full review” from HTTP or CLI. |
| **AuthService** | Returns `GITHUB_TOKEN` or `GITLAB_TOKEN` from env. Stub for multi-provider. | Central place for VCS tokens used by Git and Notification. |

---

## Hands-on examples

### 1. Health check (server)

```bash
npm run build && npm start
# In another terminal:
curl http://localhost:3000/health
# → {"ok":true}
```

### 2. Full review on local code (no server)

Runs the full graph on `code-examples/` and prints the report and score. Needs `GROQ_API_KEY` or `ANTHROPIC_API_KEY` in `.env`.

```bash
cp config/env.example .env
# Edit .env: set GROQ_API_KEY or ANTHROPIC_API_KEY

npm run review:examples
```

You’ll see orchestrator → security, architecture, test_quality, documentation → aggregator. Output ends with `--- REVIEW REPORT ---` and `--- SCORE: X / 100 ---`.

### 3. Full review via HTTP (server)

With the server running and API key in `.env`:

```bash
curl -X POST http://localhost:3000/webhook/review
```

Returns JSON: `{ "ok": true, "score": 85, "report": "..." }`. Uses `local://code-examples` as input (same as `review:examples`). Expect ~30–90s.

### 4. Try with your own code

Add or replace files in `code-examples/` (e.g. `code-examples/my-feature.ts`), then:

```bash
npm run review:examples
```

Or with server: `curl -X POST http://localhost:3000/webhook/review`. The orchestrator will load all `.ts`/`.tsx`/`.js`/`.jsx` files from `code-examples/` and run the same pipeline.

### 5. Optional: GitHub PR review

To run on a real PR, call the webhook with a PR URL (implementation may require body/query params; see `app/routes/webhook.routes.ts` and `app/controllers/webhook.controller.ts`). Ensure `GITHUB_TOKEN` is set in `.env` so GitService and NotificationService can fetch the diff and post the comment.

### 6. Optional: Lint / AST / Semgrep tools

The repo includes tools that wrap LinterService, ASTService, and SemgrepService. They are not used inside the LangGraph by default; you can invoke them from scripts or other entrypoints to get ESLint results, complexity metrics, or Semgrep findings alongside the agent review.

---

## Setup

```bash
npm install
cp config/env.example .env
```

## Scripts

- `npm run start` — Run built server
- `npm run build` — Webpack build to dist/
- `npm run test` — Run tests
- `npm run dev` — Start dev server
- `npm run lint` — ESLint
- `npm run review:examples` — Run review on `code-examples/` (no server)

## Structure

- `app/` — Application code
- `tests/` — Specs (*.spec.ts)
- `code-examples/` — Sample code for integration test (add your own files)
- `config/` — App config YAML + env.example only
- `docs/` — Documentation

## Docs

- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Agent Network Spec](docs/code-review-agent-network.md)
