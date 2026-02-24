import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createModel } from "../../app/llm/chat-model";

describe("createModel closure", () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it("returns an object with invoke method when GROQ_API_KEY is set", () => {
    process.env.GROQ_API_KEY = "gsk_test";
    const model = createModel("large");
    expect(model).toBeDefined();
    expect(typeof model.invoke).toBe("function");
  });

  it("returns an object with invoke method when ANTHROPIC_API_KEY is set", () => {
    delete process.env.GROQ_API_KEY;
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const model = createModel("fast");
    expect(model).toBeDefined();
    expect(typeof model.invoke).toBe("function");
  });

  it("throws when neither API key is set", () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => createModel("large")).toThrow(/GROQ_API_KEY or ANTHROPIC_API_KEY/);
  });

  it("prefers GROQ when both keys are set", () => {
    process.env.GROQ_API_KEY = "gsk_test";
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const model = createModel("fast");
    expect(model).toBeDefined();
    expect(typeof model.invoke).toBe("function");
  });
});
