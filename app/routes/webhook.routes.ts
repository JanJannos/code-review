import { Router } from "express";
import { postReview, postGitHub } from "../controllers/webhook.controller";

export const webhookRouter = Router();

webhookRouter.post("/review", postReview);
webhookRouter.post("/github", postGitHub);
