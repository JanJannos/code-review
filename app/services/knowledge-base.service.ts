/**
 * Searches ADRs and past review decisions via vector store.
 * Returns empty string when Pinecone is not configured.
 */
export class KnowledgeBaseService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- query used when Pinecone configured
  async search(query: string): Promise<string> {
    // Stub: in production, use EmbeddingService + Pinecone to find relevant ADRs
    return "No ADRs configured. Add PINECONE_API_KEY and index ADRs for architecture compliance checks.";
  }
}
