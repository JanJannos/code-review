# Code Review Agent Network

AI-powered code review using LangGraph and Claude.

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
- `config/` — Configuration
- `docs/` — Documentation

## Docs

- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Agent Network Spec](docs/code-review-agent-network.md)
