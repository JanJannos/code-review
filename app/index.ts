import "dotenv/config";
import express from "express";
import { webhookRouter } from "./api/webhook.controller.js";
import { DEFAULT_PORT } from "./constants.js";

const app = express();
app.use(express.json());
app.use("/webhook", webhookRouter);

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? DEFAULT_PORT;
app.listen(PORT, () =>
  console.log(`Code Review Agent running on port ${PORT}`)
);
