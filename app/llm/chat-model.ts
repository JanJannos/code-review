import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { ChatAnthropic } from "@langchain/anthropic";
import { MODELS } from "../config";

type ChatModel = InstanceType<typeof ChatGroq> | InstanceType<typeof ChatAnthropic>;

export const createModel = (tier: "large" | "fast"): ChatModel => {
  if (process.env.GROQ_API_KEY) {
    return new ChatGroq({
      model: tier === "large" ? MODELS.GROQ_LARGE : MODELS.GROQ_FAST,
      temperature: 0,
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return new ChatAnthropic({
      model: tier === "large" ? MODELS.ANTHROPIC_SONNET : MODELS.ANTHROPIC_HAIKU,
      temperature: 0,
    });
  }
  throw new Error(
    "GROQ_API_KEY or ANTHROPIC_API_KEY required. Add to .env or run: GROQ_API_KEY=gsk_... npm run review:examples"
  );
};

export const chatModelLarge = createModel("large");
export const chatModelFast = createModel("fast");
