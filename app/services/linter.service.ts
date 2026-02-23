import { ESLint } from "eslint";

export class LinterService {
  async run(files: string[]): Promise<ESLint.LintResult[]> {
    const filtered = files.filter((f) => f.match(/\.[tj]sx?$/));
    if (filtered.length === 0) return [];

    const eslint = new ESLint();
    const results = await eslint.lintFiles(filtered);
    return results;
  }
}
