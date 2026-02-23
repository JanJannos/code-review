import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import fs from "fs/promises";

export class ASTService {
  async analyzeComplexity(files: string[]): Promise<Record<string, number>> {
    const parser = new Parser();
    parser.setLanguage(TypeScript.typescript);
    const results: Record<string, number> = {};

    const filtered = files.filter((f) => f.match(/\.tsx?$/));
    for (const file of filtered) {
      try {
        const source = await fs.readFile(file, "utf8");
        const tree = parser.parse(source);
        let complexity = 1;
        const cursor = tree.walk();
        do {
          if (
            [
              "if_statement",
              "switch_case",
              "for_statement",
              "while_statement",
              "catch_clause",
              "conditional_expression",
            ].includes(cursor.nodeType)
          ) {
            complexity++;
          }
        } while (cursor.gotoNextSibling() || cursor.gotoParent());
        results[file] = complexity;
      } catch {
        // Skip files that can't be read/parsed
      }
    }
    return results;
  }
}
