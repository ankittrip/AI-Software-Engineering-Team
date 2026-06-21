import { retrieveSimilarFindings } from "./retrieveSimilarFindings.js";

export const getHistoricalSecurityContext = async (
  criticalThreats = [],
  currentRepoUrl = null
) => {
  console.log("[RAG] Processing threats:", criticalThreats?.length || 0);

  if (!criticalThreats || criticalThreats.length === 0) {
    return [];
  }

  const historyPromises = criticalThreats.map(async (threat) => {
    console.log("[RAG] Searching for:", threat);

    const matches = await retrieveSimilarFindings(
      threat,
      currentRepoUrl,
      3
    );

    console.log(`[RAG] Found ${matches.length} matches for threat`);

    if (matches.length > 0) {
      return {
        threat,
        matches,
      };
    }
    
    return null;
  });

  const rawHistory = await Promise.all(historyPromises);
  const history = rawHistory.filter(Boolean);

  console.log(
    "[RAG] Historical Context Result:",
    JSON.stringify(history, null, 2)
  );

  return history;
};