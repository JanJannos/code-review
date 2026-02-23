# AI Code Review Agent Network — Implementation Plan

## Phase 1: Project Bootstrap
- [ ] `npm init -y` + install all deps (LangGraph, Anthropic, Zod, Express, etc.)
- [ ] `tsconfig.json` with strict mode
- [ ] `.env.example` with required vars
- [ ] Basic `package.json` scripts: `dev`, `build`, `start`, `lint`

## Phase 2: Core State & Graph
- [ ] `src/graph/state.ts` — `FindingSchema`, `ReviewStateAnnotation`
- [ ] `src/graph/review.graph.ts` — `StateGraph` with nodes and edges (stub nodes first)

## Phase 3: Services (Bottom-Up)
| Order | Service | Deps |
|-------|---------|------|
| 1 | `cache.service.ts` | ioredis |
| 2 | `git.service.ts` | axios |
| 3 | `linter.service.ts` | eslint |
| 4 | `ast.service.ts` | tree-sitter, tree-sitter-typescript |
| 5 | `semgrep.service.ts` | child_process |
| 6 | `embedding.service.ts` | pinecone (optional for Phase 1) |
| 7 | `knowledge-base.service.ts` | embedding + pinecone |
| 8 | `notification.service.ts` | axios |
| 9 | `report.service.ts` | fs |
| 10 | `auth.service.ts` | (optional, defer) |

## Phase 4: Agents (Top-Down)
| Order | Agent | Services Used |
|-------|-------|---------------|
| 1 | `orchestrator.agent.ts` | GitService |
| 2 | `static-analysis.agent.ts` | LinterService, ASTService |
| 3 | `security.agent.ts` | SemgrepService |
| 4 | `architecture.agent.ts` | KnowledgeBaseService |
| 5 | `test-quality.agent.ts` | (none — diff only) |
| 6 | `documentation.agent.ts` | (none — diff only) |
| 7 | `aggregator.agent.ts` | NotificationService, ReportService |

## Phase 5: API & Entry
- [ ] `src/api/webhook.controller.ts` — POST `/webhook/github`
- [ ] `src/index.ts` — Express app, health check

## Phase 6: Tools (Optional — for tool-calling agents)
- [ ] `fetch-pr.tool.ts`, `lint.tool.ts`, `ast.tool.ts`, `semgrep.tool.ts`, `search-codebase.tool.ts`
- Defer if agents use services directly (as in spec)

## Phase 7: Polish
- [ ] Redis checkpointer for resumability
- [ ] Human-in-the-loop interrupt for critical findings
- [ ] BullMQ queue for webhook → graph (decouple from HTTP handler)
- [ ] Error handling + `status: "failed"` in state

---

## Suggested First Milestone
**MVP:** Orchestrator + Static Analysis + Aggregator only. Skip Security, Architecture, Test, Doc agents. Get end-to-end flow working (webhook → diff → lint → report).

---

## Env Vars Required
```
ANTHROPIC_API_KEY
GITHUB_TOKEN
REDIS_URL (optional for MVP)
SLACK_WEBHOOK_URL (optional)
PINECONE_* (optional for MVP — skip KnowledgeBaseService)
```

---

## External Dependencies
- **Semgrep:** Must be installed (`brew install semgrep` or `pip install semgrep`)
- **Redis:** For cache + optional checkpointer
- **ESLint config:** Project needs `.eslintrc` or `eslint.config.js` for LinterService
