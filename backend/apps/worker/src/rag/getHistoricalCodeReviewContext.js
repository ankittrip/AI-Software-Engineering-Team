import { retrieveSimilarFindings } from "./retrieveSimilarFindings.js";

export const getHistoricalCodeReviewContext = async (currentRepoUrl) => {
  console.log("[RAG] Fetching past Code Review memory...");

  if (!currentRepoUrl) {
    console.warn("[RAG] No repo URL provided for historical code review fetch.");
    return [];
  }

  const semanticQuery = "Identify recurring code quality issues, anti-patterns, messy logic, and areas requiring significant refactoring or optimization in this codebase.";

  try {
    const matches = await retrieveSimilarFindings(
      semanticQuery,
      currentRepoUrl,
      10,
      "code-review" 
    );

    if (matches && matches.length > 0) {
      console.log(`[RAG] Found ${matches.length} past code review issues from memory.`);
      return matches;
    }

    return [];
  } catch (error) {
    console.error("[RAG Code Review History Error]", error.message);
    return [];
  }
};