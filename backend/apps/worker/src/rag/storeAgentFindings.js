import { getCollection } from "./chromaClient.js";
import { generateEmbedding } from "./embeddingService.js";
import crypto from "crypto";

export const storeAgentFindings = async ({
  repoUrl,
  scanId,
  agent,
  findings,
  severity = "unknown",
}) => {
  try {
    if (!findings || findings.length === 0) {
      return;
    }

    const collection = await getCollection();
    
    const ids = [];
    const documents = [];
    const metadatas = [];

    for (const finding of findings) {
      let textToStore = finding;
      
      if (typeof finding === "object" && finding !== null) {
        textToStore = finding.threat || finding.message || finding.finding || JSON.stringify(finding);
      }

      if (!textToStore || typeof textToStore !== "string") {
        console.log("[RAG WARNING] Skipping invalid finding:", finding);
        continue;
      }

      documents.push(textToStore);
      ids.push(crypto.randomUUID());
      metadatas.push({
        repoUrl,
        repoName: repoUrl?.split("/").pop() || "unknown",
        scanId,
        agent,
        severity,
        createdAt: new Date().toISOString(),
      });
    }

    if (documents.length === 0) {
      console.log(`[RAG] No valid findings to store for ${agent}.`);
      return;
    }

    console.log(`[RAG] Generating ${documents.length} embeddings in parallel for ${agent}...`);

    const embeddings = await Promise.all(
      documents.map((text) => generateEmbedding(text))
    );

    await collection.add({
      ids,
      embeddings,
      documents,
      metadatas,
    });

    const totalDocs = await collection.count();
    
    console.log(
      `[RAG] Successfully BATCH stored ${documents.length} findings from ${agent}. Total docs in DB: ${totalDocs}`
    );

  } catch (error) {
    console.error(`[RAG Store Error - ${agent}]`, error.message);
  }
};