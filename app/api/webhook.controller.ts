import { Router, Request, Response } from "express";
import { buildReviewGraph } from "../graph/review.graph.js";

export const webhookRouter = Router();

webhookRouter.post("/github", async (req: Request, res: Response) => {
  const event = req.headers["x-github-event"];
  const payload = req.body;

  if (event !== "pull_request") return res.status(200).json({ ok: true });
  if (!["opened", "synchronize"].includes(payload.action))
    return res.status(200).json({ ok: true });

  const prUrl = payload.pull_request.html_url;
  const prNumber = payload.pull_request.number;
  const repo = payload.repository.full_name;

  res.status(202).json({ accepted: true });

  try {
    const graph = buildReviewGraph();
    await graph.invoke({
      prUrl,
      prNumber,
      repo,
      diff: "",
      files: [],
      language: "",
      staticFindings: [],
      securityFindings: [],
      architectureFindings: [],
      testFindings: [],
      docFindings: [],
      status: "pending",
    });
  } catch (err) {
    console.error("Graph execution failed:", err);
  }
});
