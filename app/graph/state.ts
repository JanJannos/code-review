import { z } from "zod";
import { Annotation } from "@langchain/langgraph";

export const FindingSchema = z.object({
  id: z.string(),
  agent: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  file: z.string(),
  line: z.number().optional(),
  title: z.string(),
  description: z.string(),
  suggestion: z.string().optional(),
});

export type Finding = z.infer<typeof FindingSchema>;

export const ReviewStateAnnotation = Annotation.Root({
  prUrl: Annotation<string>(),
  prNumber: Annotation<number>(),
  repo: Annotation<string>(),
  diff: Annotation<string>(),
  files: Annotation<string[]>(),
  language: Annotation<string>(),
  staticFindings: Annotation<Finding[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  securityFindings: Annotation<Finding[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  architectureFindings: Annotation<Finding[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  testFindings: Annotation<Finding[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  docFindings: Annotation<Finding[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  finalReport: Annotation<string>(),
  overallScore: Annotation<number>(),
  status: Annotation<"pending" | "running" | "complete" | "failed">(),
  error: Annotation<string | undefined>(),
});

export type ReviewState = typeof ReviewStateAnnotation.State;
