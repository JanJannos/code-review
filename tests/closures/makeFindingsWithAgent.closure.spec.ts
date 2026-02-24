import { describe, it, expect } from "vitest";
import { makeFindingsWithAgent } from "../../app/closures/makeFindingsWithAgent.closure";

describe("makeFindingsWithAgent closure", () => {
  it("returns a function that adds agent and id to each finding", () => {
    const toFindings = makeFindingsWithAgent("security");
    const parsed = [
      { severity: "high" as const, file: "a.ts", title: "T", description: "D" },
      { severity: "low" as const, file: "b.ts", line: 10, title: "U", description: "E" },
    ];
    const result = toFindings(parsed);
    expect(result).toHaveLength(2);
    result.forEach((f, i) => {
      expect(f.agent).toBe("security");
      expect(typeof f.id).toBe("string");
      expect(f.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(f.severity).toBe(parsed[i].severity);
      expect(f.file).toBe(parsed[i].file);
      expect(f.title).toBe(parsed[i].title);
    });
  });

  it("returns empty array when given empty parsed array", () => {
    const toFindings = makeFindingsWithAgent("documentation");
    expect(toFindings([])).toEqual([]);
  });

  it("each invocation generates unique ids", () => {
    const toFindings = makeFindingsWithAgent("architecture");
    const parsed = [{ severity: "medium" as const, file: "x", title: "T", description: "D" }];
    const a = toFindings(parsed);
    const b = toFindings(parsed);
    expect(a[0].id).not.toBe(b[0].id);
    expect(a[0].agent).toBe("architecture");
    expect(b[0].agent).toBe("architecture");
  });
});
