const DEFAULT_LANG_MAP: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  py: "Python",
  go: "Go",
  java: "Java",
  cs: "C#",
};

/**
 * Returns a closure that infers language from file list using the given map (or default).
 */
export const createInferLanguage = (langMap: Record<string, string> = DEFAULT_LANG_MAP) =>
  (files: string[]): string => {
    const ext = files[0]?.split(".").pop() ?? "ts";
    return langMap[ext] ?? "Unknown";
  };

/** Infers language from files using default extension map. */
export const inferLanguageFromFiles = createInferLanguage();
