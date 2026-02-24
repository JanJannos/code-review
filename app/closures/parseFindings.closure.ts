import type { Finding } from "../graph/state";

/**
 * Parses raw LLM output (JSON array, optionally wrapped in ```json) into findings without id/agent.
 */
export const parseFindings = (raw: string): Omit<Finding, "id" | "agent">[] => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
