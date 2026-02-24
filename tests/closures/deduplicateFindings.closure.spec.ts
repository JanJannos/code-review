import { describe, it, expect } from "vitest";
import {
  deduplicateFindings,
  createDeduplicateFindings,
  defaultDedupeKey,
} from "../../app/closures/deduplicateFindings.closure";
import type { Finding } from "../../app/graph/state";

const base: Finding = {
  id: "1",
  agent: "security",
  severity: "high",
  file: "a.ts",
  line: 10,
  title: "Issue",
  description: "D",
};

describe("defaultDedupeKey closure", () => {
  it("returns file:line:title", () => {
    expect(defaultDedupeKey(base)).toBe("a.ts:10:Issue");
  });

  it("uses empty string for missing line", () => {
    expect(defaultDedupeKey({ ...base, line: undefined })).toBe("a.ts::Issue");
  });
});

describe("deduplicateFindings closure", () => {
  it("removes duplicates by file:line:title", () => {
    const findings: Finding[] = [
      base,
      { ...base, id: "2", agent: "architecture", description: "D2" },
    ];
    const deduped = deduplicateFindings(findings);
    expect(deduped).toHaveLength(1);
  });

  it("keeps findings with same file but different line", () => {
    const findings: Finding[] = [
      { ...base, id: "1", line: 10 },
      { ...base, id: "2", line: 20 },
    ];
    const deduped = deduplicateFindings(findings);
    expect(deduped).toHaveLength(2);
  });

  it("keeps findings with different title", () => {
    const findings: Finding[] = [
      { ...base, id: "1", title: "A" },
      { ...base, id: "2", title: "B" },
    ];
    const deduped = deduplicateFindings(findings);
    expect(deduped).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateFindings([])).toEqual([]);
  });
});

describe("createDeduplicateFindings closure", () => {
  it("uses custom key function", () => {
    const dedupeByFile = createDeduplicateFindings((f) => f.file);
    const findings: Finding[] = [
      { ...base, id: "1", line: 10, title: "A" },
      { ...base, id: "2", line: 20, title: "B" },
    ];
    const deduped = dedupeByFile(findings);
    expect(deduped).toHaveLength(1);
  });

  it("default keyFn is file:line:title", () => {
    const withDefault = createDeduplicateFindings();
    const findings: Finding[] = [
      base,
      { ...base, id: "2", agent: "other" },
    ];
    expect(withDefault(findings)).toHaveLength(1);
  });
});
