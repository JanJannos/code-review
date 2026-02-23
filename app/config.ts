import fs from "fs";
import path from "path";
import { parse } from "yaml";
import type { Finding } from "./graph/state";

const configPath = path.join(process.cwd(), "config", "config.yaml");
const raw = fs.readFileSync(configPath, "utf8");
const data = parse(raw) as {
  models: Record<string, string>;
  severity_score: Record<string, number>;
  diff_limits: Record<string, number>;
  semgrep_timeout_ms: number;
  cache_ttl_seconds: number;
  default_port: number;
  redis_default_url: string;
  pinecone_default_index: string;
  code_examples_path: string;
};

export const MODELS = {
  ANTHROPIC_SONNET: data.models.anthropic_sonnet,
  ANTHROPIC_HAIKU: data.models.anthropic_haiku,
  GROQ_LARGE: data.models.groq_large,
  GROQ_FAST: data.models.groq_fast,
} as const;

export const SEVERITY_SCORE: Record<Finding["severity"], number> = {
  critical: data.severity_score.critical,
  high: data.severity_score.high,
  medium: data.severity_score.medium,
  low: data.severity_score.low,
  info: data.severity_score.info,
};

export const DIFF_LIMITS = {
  STATIC: data.diff_limits.static,
  DEFAULT: data.diff_limits.default,
  ADR_SEARCH: data.diff_limits.adr_search,
} as const;

export const SEMGREP_TIMEOUT_MS = data.semgrep_timeout_ms;
export const CACHE_TTL_SECONDS = data.cache_ttl_seconds;
export const DEFAULT_PORT = data.default_port;
export const REDIS_DEFAULT_URL = data.redis_default_url;
export const PINECONE_DEFAULT_INDEX = data.pinecone_default_index;
export const CODE_EXAMPLES_PATH = data.code_examples_path;
