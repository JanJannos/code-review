import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_DEFAULT_INDEX } from "../constants.js";

export class EmbeddingService {
  private client: Pinecone | null = null;
  private indexName: string;

  constructor() {
    this.indexName = process.env.PINECONE_INDEX ?? PINECONE_DEFAULT_INDEX;
    if (process.env.PINECONE_API_KEY) {
      this.client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    }
  }

  async upsert(
    id: string,
    vector: number[],
    metadata?: Record<string, string | number | boolean>
  ): Promise<void> {
    if (!this.client) return;
    const index = this.client.index(this.indexName);
    await index.upsert([{ id, values: vector, metadata: metadata ?? {} }]);
  }

  async query(vector: number[], topK = 5): Promise<{ id: string; score?: number }[]> {
    if (!this.client) return [];
    const index = this.client.index(this.indexName);
    const result = await index.query({ vector, topK });
    return (result.matches ?? []).map((m) => ({
      id: m.id ?? "",
      score: m.score,
    }));
  }
}
