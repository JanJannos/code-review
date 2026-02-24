import { describe, it, expect } from "vitest";
import {
  createScoreFromFindings,
  createOverallScore,
} from "../../app/closures/scoreFromFindings.closure";
import type { Finding } from "../../app/graph/state";

const severityScore: Record<string, number> = {
  critical: 100,
  high: 50,
  medium: 20,
  low: 5,
  info: 1,
};

const makeFinding = (severity: Finding["severity"], file = "a.ts"): Finding => ({
  id: "1",
  agent: "security",
  severity,
  file,
  title: "T",
  description: "D",
});

describe("createScoreFromFindings closure", () => {
  it("sums penalty from severity map", () => {
    const totalPenalty = createScoreFromFindings(severityScore);
    const findings: Finding[] = [
      makeFinding("high"),
      makeFinding("medium"),
      makeFinding("low"),
    ];
    expect(totalPenalty(findings)).toBe(50 + 20 + 5);
  });

  it("returns 0 for empty findings", () => {
    const totalPenalty = createScoreFromFindings(severityScore);
    expect(totalPenalty([])).toBe(0);
  });

  it("uses 0 for unknown severity", () => {
    const totalPenalty = createScoreFromFindings(severityScore);
    const findings: Finding[] = [
      { ...makeFinding("high"), severity: "unknown" as Finding["severity"] },
    ];
    expect(totalPenalty(findings)).toBe(0);
  });
});

describe("createOverallScore closure", () => {
  it("returns 100 minus total penalty, floored at 0", () => {
    const getOverallScore = createOverallScore(severityScore);
    const findings: Finding[] = [makeFinding("high"), makeFinding("low")];
    expect(getOverallScore(findings)).toBe(100 - 50 - 5);
  });

  it("returns 100 for no findings", () => {
    const getOverallScore = createOverallScore(severityScore);
    expect(getOverallScore([])).toBe(100);
  });

  it("returns 0 when penalty >= 100", () => {
    const getOverallScore = createOverallScore(severityScore);
    const findings: Finding[] = [
      makeFinding("critical"),
      makeFinding("critical"),
    ];
    expect(getOverallScore(findings)).toBe(0);
  });
});
