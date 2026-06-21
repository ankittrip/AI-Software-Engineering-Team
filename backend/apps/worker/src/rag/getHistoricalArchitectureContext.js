import { retrieveSimilarFindings } from "./retrieveSimilarFindings.js";

export const getHistoricalArchitectureContext = async (currentRepoUrl) => {
  console.log("[RAG] Fetching past Architecture memory...");

  if (!currentRepoUrl) {
    console.warn("[RAG] No repo URL provided for historical architecture fetch.");
    return [];
  }

  const semanticQuery = "Identify underlying architectural flaws, structural technical debt, tight coupling, and systemic scalability bottlenecks in this repository.";

  try {
    const matches = await retrieveSimilarFindings(
      semanticQuery,
      currentRepoUrl,
      10,
      "architecture"
    );

    if (matches && matches.length > 0) {
      console.log(`[RAG] Found ${matches.length} past architecture issues from memory.`);
      return matches;
    }

    return [];
  } catch (error) {
    console.error("[RAG Architecture History Error]", error.message);
    return [];
  }
};