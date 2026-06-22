import { ChromaClient } from "chromadb";


console.log("[DEBUG] CHROMA DB URL IS SET TO:", process.env.CHROMA_URL);
const client = new ChromaClient({
  path: process.env.CHROMA_URL || "http://127.0.0.1:8001",
});

const COLLECTION_NAME = "repo_memory";

const dummyEmbeddingFunction = {
  generate: async (texts) => {
    return texts.map(() => [0]); 
  }
};

export const getCollection = async () => {
  return await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: dummyEmbeddingFunction,
  });
};