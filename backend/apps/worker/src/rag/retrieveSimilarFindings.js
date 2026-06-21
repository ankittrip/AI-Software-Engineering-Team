import { getCollection } from "./chromaClient.js";
import { generateEmbedding } from "./embeddingService.js";

const MAX_DISTANCE = 1.1; 

export const retrieveSimilarFindings = async (
  query,
  currentRepoUrl = null,
  limit = 5,
  agentFilter = null
) => {
  try {
    console.log("[RAG] Getting collection...");
    const collection = await getCollection();

    const totalDocs = await collection.count();
    console.log(`[RAG DEBUG] Total documents in ChromaDB right now: ${totalDocs}`);

    console.log("[RAG] Generating query embedding...");
    const queryEmbedding = await generateEmbedding(query);

    console.log("[RAG] Querying Chroma...");

    let whereFilter = {};
    
    if (agentFilter) {
      whereFilter.agent = agentFilter;
    }
    
    if (currentRepoUrl) {
      whereFilter.repoUrl = currentRepoUrl;
    }

    const queryParams = {
      queryEmbeddings: [queryEmbedding],
      nResults: limit * 2,
    };

    if (Object.keys(whereFilter).length > 0) {
      if (Object.keys(whereFilter).length > 1) {
        queryParams.where = {
          $and: [
            { agent: whereFilter.agent },
            { repoUrl: whereFilter.repoUrl }
          ]
        };
      } else {
        queryParams.where = whereFilter;
      }
    }

    const results = await collection.query(queryParams);

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[RAG] Raw Results:",
        JSON.stringify(results, null, 2)
      );
    }

    const formattedResults =
      results.documents?.[0]
        ?.map((doc, index) => ({
          finding: doc,
          distance: results.distances?.[0]?.[index],
          repoName: results.metadatas?.[0]?.[index]?.repoName,
          repoUrl: results.metadatas?.[0]?.[index]?.repoUrl,
          severity: results.metadatas?.[0]?.[index]?.severity,
          agent: results.metadatas?.[0]?.[index]?.agent,
          createdAt: results.metadatas?.[0]?.[index]?.createdAt,
        }))
        .filter((item) => item.distance <= MAX_DISTANCE)
        .slice(0, limit) || [];

    console.log(`[RAG] Found ${formattedResults.length} relevant matches (Distance <= ${MAX_DISTANCE})`);

    return formattedResults;
  } catch (error) {
    console.error("[RAG Retrieve Error]", error);
    return [];
  }
};