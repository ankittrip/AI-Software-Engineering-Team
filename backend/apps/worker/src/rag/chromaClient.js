import { ChromaClient } from "chromadb";

console.log(" [DEBUG] USING DIRECT CHROMA DB LINK");


const client = new ChromaClient({
  path: "https://my-chromadb-server.onrender.com",
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
