import fs from "fs/promises";
import path from "path";
import { Finding } from "../graph/state.js";

export interface Report {
  prUrl: string;
  findings: Finding[];
  score: number;
  markdown: string;
}

export class ReportService {
  async save(report: Report): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dir = path.join(process.cwd(), "reports");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `review-${timestamp}.json`),
      JSON.stringify(report, null, 2)
    );
    await fs.writeFile(path.join(dir, `review-${timestamp}.md`), report.markdown);
  }
}
