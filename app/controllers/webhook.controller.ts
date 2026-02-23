import type { Request, Response } from "express";
import { ReviewService } from "../services/review.service";

const reviewService = new ReviewService();

export const postReview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await reviewService.runLocal();
    res.json({
      ok: true,
      score: result.overallScore,
      report: result.finalReport,
    });
  } catch (err) {
    console.error("Review failed:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
};

export const postGitHub = async (req: Request, res: Response): Promise<void> => {
  const event = req.headers["x-github-event"];
  const payload = req.body;

  if (event !== "pull_request") {
    res.status(200).json({ ok: true });
    return;
  }
  if (!["opened", "synchronize"].includes(payload?.action)) {
    res.status(200).json({ ok: true });
    return;
  }

  const prUrl = payload.pull_request.html_url;
  const prNumber = payload.pull_request.number;
  const repo = payload.repository.full_name;

  res.status(202).json({ accepted: true });

  try {
    await reviewService.runForPR(prUrl, prNumber, repo);
  } catch (err) {
    console.error("Graph execution failed:", err);
  }
};
