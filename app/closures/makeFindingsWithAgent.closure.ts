import { v4 as uuid } from "uuid";
import type { Finding } from "../graph/state";

type FindingWithoutMeta = Omit<Finding, "id" | "agent">;

/**
 * Returns a closure that maps parsed findings to full Finding[] with the given agent and generated ids.
 */
export const makeFindingsWithAgent = (agent: string) => (parsed: FindingWithoutMeta[]): Finding[] =>
  parsed.map((f) => ({
    ...f,
    id: uuid(),
    agent,
  }));
