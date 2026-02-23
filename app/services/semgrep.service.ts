import { execSync } from "child_process";
import { SEMGREP_TIMEOUT_MS } from "../config";

export class SemgrepService {
  async scan(files: string[]): Promise<unknown[]> {
    const filtered = files.filter((f) => f.match(/\.(ts|tsx|js|jsx|py|go|java)$/));
    if (filtered.length === 0) return [];

    try {
      const fileList = filtered.join(" ");
      const output = execSync(`semgrep --config=auto --json ${fileList}`, {
        encoding: "utf8",
        timeout: SEMGREP_TIMEOUT_MS,
      });
      const parsed = JSON.parse(output) as { results?: unknown[] };
      return parsed.results ?? [];
    } catch (e: unknown) {
      const err = e as { stdout?: string };
      try {
        const parsed = JSON.parse(err.stdout ?? "{}") as { results?: unknown[] };
        return parsed.results ?? [];
      } catch {
        return [];
      }
    }
  }
}
