import type { Finding } from "../graph/state";

export const defaultDedupeKey = (f: Finding): string =>
  `${f.file}:${f.line ?? ""}:${f.title}`;

/**
 * Returns a closure that deduplicates findings by the given key. Default key is file:line:title.
 */
export const createDeduplicateFindings = (keyFn: (f: Finding) => string = defaultDedupeKey) =>
  (findings: Finding[]): Finding[] => {
    const seen = new Set<string>();
    return findings.filter((f) => {
      const key = keyFn(f);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

/** Deduplicates findings by file:line:title. */
export const deduplicateFindings = createDeduplicateFindings();
