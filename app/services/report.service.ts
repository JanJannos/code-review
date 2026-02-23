import type { Finding } from "../graph/state";

export interface Report {
  prUrl: string;
  findings: Finding[];
  score: number;
  markdown: string;
}

export class ReportService {
  async save(_report: Report): Promise<void> {
    // No-op: reports are not persisted to disk.
  }
}
