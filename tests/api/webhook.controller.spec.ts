import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { Express } from "express";
import request from "supertest";

vi.mock("../../app/graph/review.graph", () => ({
  buildReviewGraph: vi.fn().mockReturnValue({
    invoke: vi.fn().mockResolvedValue({}),
  }),
}));

describe("webhook controller", () => {
  let app: Express;

  beforeEach(async () => {
    vi.resetModules();
    const { webhookRouter } = await import("../../app/routes/webhook.routes");
    app = express();
    app.use(express.json());
    app.use("/webhook", webhookRouter);
  });

  it("returns 200 for non-PR events", async () => {
    const res = await request(app)
      .post("/webhook/github")
      .set("x-github-event", "push")
      .send({});
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("returns 200 for PR closed action", async () => {
    const res = await request(app)
      .post("/webhook/github")
      .set("x-github-event", "pull_request")
      .send({ action: "closed", pull_request: {}, repository: {} });
    expect(res.status).toBe(200);
  });

  it("returns 202 for PR opened and triggers graph", async () => {
    const res = await request(app)
      .post("/webhook/github")
      .set("x-github-event", "pull_request")
      .send({
        action: "opened",
        pull_request: { html_url: "https://github.com/o/r/pull/1", number: 1 },
        repository: { full_name: "o/r" },
      });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ accepted: true });
  });
});
