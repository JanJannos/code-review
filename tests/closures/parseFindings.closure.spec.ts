import { describe, it, expect } from "vitest";
import { parseFindings } from "../../app/closures/parseFindings.closure";

describe("parseFindings closure", () => {
  it("returns empty array for invalid JSON", () => {
    expect(parseFindings("not json")).toEqual([]);
    expect(parseFindings("")).toEqual([]);
    expect(parseFindings("null")).toEqual([]);
  });

  it("returns empty array when parsed value is not an array", () => {
    expect(parseFindings("{}")).toEqual([]);
    expect(parseFindings("123")).toEqual([]);
    expect(parseFindings('"string"')).toEqual([]);
  });

  it("parses valid JSON array", () => {
    const raw = '[{"severity":"high","file":"a.ts","line":1,"title":"T","description":"D"}]';
    const out = parseFindings(raw);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ severity: "high", file: "a.ts", line: 1, title: "T", description: "D" });
  });

  it("strips ```json and ``` wrappers", () => {
    const raw = "```json\n[{\"severity\":\"low\",\"file\":\"b.ts\",\"title\":\"X\",\"description\":\"Y\"}]\n```";
    const out = parseFindings(raw);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ severity: "low", file: "b.ts", title: "X", description: "Y" });
  });

  it("returns multiple findings", () => {
    const raw = '[{"severity":"info","file":"f","title":"A","description":"B"},{"severity":"medium","file":"g","title":"C","description":"D"}]';
    const out = parseFindings(raw);
    expect(out).toHaveLength(2);
    expect(out[0].title).toBe("A");
    expect(out[1].title).toBe("C");
  });
});
