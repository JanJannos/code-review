import fs from "fs/promises";
import path from "path";
import { CODE_EXAMPLES_PATH } from "../constants.js";

export async function loadCodeExamples(): Promise<{ diff: string; files: string[] }> {
  const root = path.join(process.cwd(), CODE_EXAMPLES_PATH);
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];
  const chunks: string[] = [];

  for (const e of entries) {
    if (!e.isFile() || !e.name.match(/\.(ts|tsx|js|jsx)$/)) continue;
    const filePath = path.join(root, e.name);
    const content = await fs.readFile(filePath, "utf8");
    files.push(filePath);
    chunks.push(`diff --git a/${e.name} b/${e.name}`);
    chunks.push(`--- a/${e.name}`);
    chunks.push(`+++ b/${e.name}`);
    content.split("\n").forEach((line) => {
      chunks.push(`+${line}`);
    });
  }

  return {
    diff: chunks.join("\n"),
    files,
  };
}
