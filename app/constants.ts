import type { Finding } from "./graph/state.js";

export const MODELS = {
  SONNET: "claude-sonnet-4-20250514",
  HAIKU: "claude-3-5-haiku-20241022",
} as const;

export const SEVERITY_SCORE: Record<Finding["severity"], number> = {
  critical: 100,
  high: 50,
  medium: 20,
  low: 5,
  info: 1,
};

export const DIFF_LIMITS = {
  STATIC: 8000,
  DEFAULT: 10000,
  ADR_SEARCH: 2000,
} as const;

export const SEMGREP_TIMEOUT_MS = 60000;
export const CACHE_TTL_SECONDS = 3600;
export const DEFAULT_PORT = 3000;
export const REDIS_DEFAULT_URL = "redis://localhost:6379";
export const PINECONE_DEFAULT_INDEX = "code-review";
export const CODE_EXAMPLES_PATH = "code-examples";
