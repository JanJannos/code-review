import type { Finding } from "../graph/state";

/**
 * Returns a closure that computes total penalty from findings using the given severity score map.
 */
export const createScoreFromFindings = (severityScore: Record<string, number>) =>
  (findings: Finding[]): number =>
    findings.reduce((sum, f) => sum + (severityScore[f.severity] ?? 0), 0);

/**
 * Returns a closure that computes overall score (0–100) from findings and severity map.
 */
export const createOverallScore = (severityScore: Record<string, number>) =>
  (findings: Finding[]): number =>
    Math.max(0, 100 - createScoreFromFindings(severityScore)(findings));
