import { describe, it, expect } from "vitest";
import { FindingSchema, ReviewStateAnnotation } from "../app/graph/state";

describe("FindingSchema", () => {
  it("validates a valid finding", () => {
    const finding = {
      id: "1",
      agent: "static_analysis",
      severity: "high",
      file: "src/foo.ts",
      line: 10,
      title: "Missing type",
      description: "Add explicit type",
      suggestion: "Use string",
    };
    expect(FindingSchema.parse(finding)).toEqual(finding);
  });

  it("accepts optional suggestion", () => {
    const finding = {
      id: "2",
      agent: "security",
      severity: "critical",
      file: "auth.ts",
      title: "Hardcoded secret",
      description: "Secret in code",
    };
    expect(FindingSchema.parse(finding).suggestion).toBeUndefined();
  });

  it("rejects invalid severity", () => {
    expect(() =>
      FindingSchema.parse({
        id: "3",
        agent: "test",
        severity: "invalid",
        file: "x.ts",
        title: "T",
        description: "D",
      })
    ).toThrow();
  });
});

describe("ReviewStateAnnotation", () => {
  it("has spec with expected keys", () => {
    expect(ReviewStateAnnotation.spec).toBeDefined();
    expect(ReviewStateAnnotation.spec).toHaveProperty("prUrl");
    expect(ReviewStateAnnotation.spec).toHaveProperty("securityFindings");
  });
});
