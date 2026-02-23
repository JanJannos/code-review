import { describe, it, expect } from "vitest";
import type { Finding } from "../app/graph/state";

// Test deduplication logic (replicate of aggregator)
const deduplicateFindings = (findings: Finding[]): Finding[] => {
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = `${f.file}:${f.line ?? ""}:${f.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

describe("aggregator deduplication", () => {
  it("removes duplicate findings by file:line:title", () => {
    const findings: Finding[] = [
      {
        id: "1",
        agent: "static",
        severity: "high",
        file: "a.ts",
        line: 10,
        title: "Issue",
        description: "D",
      },
      {
        id: "2",
        agent: "security",
        severity: "high",
        file: "a.ts",
        line: 10,
        title: "Issue",
        description: "D2",
      },
    ];
    const deduped = deduplicateFindings(findings);
    expect(deduped).toHaveLength(1);
  });

  it("keeps findings with same file but different line", () => {
    const findings: Finding[] = [
      {
        id: "1",
        agent: "static",
        severity: "low",
        file: "a.ts",
        line: 10,
        title: "T",
        description: "D",
      },
      {
        id: "2",
        agent: "static",
        severity: "low",
        file: "a.ts",
        line: 20,
        title: "T",
        description: "D",
      },
    ];
    const deduped = deduplicateFindings(findings);
    expect(deduped).toHaveLength(2);
  });
});
