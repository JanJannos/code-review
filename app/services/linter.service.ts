import path from "path";
import { fileURLToPath } from "url";
import { ESLint } from "eslint";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const eslintConfigPath = path.join(projectRoot, "eslint.config.mjs");

export class LinterService {
  async run(files: string[]): Promise<ESLint.LintResult[]> {
    const filtered = files.filter((f) => f.match(/\.[tj]sx?$/));
    if (filtered.length === 0) return [];

    const eslint = new ESLint({
      overrideConfigFile: eslintConfigPath,
      cwd: projectRoot,
    });
    const results = await eslint.lintFiles(filtered);
    return results;
  }
}
