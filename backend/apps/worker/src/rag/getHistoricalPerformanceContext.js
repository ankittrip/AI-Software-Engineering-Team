import { retrieveSimilarFindings } from "./retrieveSimilarFindings.js";

export const getHistoricalPerformanceContext = async (currentRepoUrl) => {
  console.log("[RAG] Fetching past Performance memory...");

  if (!currentRepoUrl) {
    console.warn("[RAG] No repo URL provided for historical performance fetch.");
    return [];
  }

  const semanticQuery = "Identify performance bottlenecks, inefficient queries, missing caching layers, and slow rendering or blocking operations in this repository.";

  try {
    const matches = await retrieveSimilarFindings(
      semanticQuery,
      currentRepoUrl,
      10,
      "performance"
    );

    if (matches && matches.length > 0) {
      console.log(`[RAG] Found ${matches.length} past performance issues from memory.`);
      return matches;
    }

    return [];
  } catch (error) {
    console.error("[RAG Performance History Error]", error.message);
    return [];
  }
};