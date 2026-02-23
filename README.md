# Code Review Agent Network

AI-powered code review using LangGraph and Claude.

## Architecture

```
                    ┌─────────────────┐
                    │   orchestrator  │  ← fetches diff/files, infers language
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │  security  │ │ architecture│ │test_quality│
       │ (LLM)      │ │ (LLM+ADRs) │ │ (LLM)      │
       └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
             │              │              │
             │       ┌──────┴──────┐       │
             │       ▼             ▼       │
             │  ┌────────────┐             │
             └──│documentation├────────────┘
                │ (LLM)      │
                └─────┬──────┘
                      │
                      ▼
               ┌─────────────────┐
               │   aggregator    │  ← merges findings, LLM synthesis, notify, save
               └─────────────────┘
```

- **Orchestrator**: Git/local files → diff, files, language
- **4 specialists**: security, architecture, test_quality, documentation — each calls LLM
- **Aggregator**: Dedupe, score, LLM → final Markdown report → NotificationService, ReportService

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

## Structure

- `app/` — Application code
- `tests/` — Specs (*.spec.ts)
- `code-examples/` — Sample code for integration test (add your own files)
- `config/` — App config YAML + env.example only
- `docs/` — Documentation

## Docs

- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Agent Network Spec](docs/code-review-agent-network.md)
