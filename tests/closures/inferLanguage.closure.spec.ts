import { describe, it, expect } from "vitest";
import {
  createInferLanguage,
  inferLanguageFromFiles,
} from "../../app/closures/inferLanguage.closure";

describe("inferLanguageFromFiles closure", () => {
  it("infers TypeScript from .ts file", () => {
    expect(inferLanguageFromFiles(["src/foo.ts"])).toBe("TypeScript");
  });

  it("infers from first file only", () => {
    expect(inferLanguageFromFiles(["a.py", "b.ts"])).toBe("Python");
  });

  it("returns Unknown for unknown extension", () => {
    expect(inferLanguageFromFiles(["file.xyz"])).toBe("Unknown");
  });

  it("defaults to ts when files is empty", () => {
    expect(inferLanguageFromFiles([])).toBe("TypeScript");
  });

  it("handles path with multiple dots", () => {
    expect(inferLanguageFromFiles(["src/utils.test.ts"])).toBe("TypeScript");
  });
});

describe("createInferLanguage closure", () => {
  it("uses custom lang map", () => {
    const infer = createInferLanguage({ rs: "Rust", ts: "TS" });
    expect(infer(["x.rs"])).toBe("Rust");
    expect(infer(["x.ts"])).toBe("TS");
  });

  it("returns Unknown for extension not in custom map", () => {
    const infer = createInferLanguage({ py: "Python" });
    expect(infer(["x.ts"])).toBe("Unknown");
  });
});
