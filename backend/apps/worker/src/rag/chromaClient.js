import { ChromaClient } from "chromadb";

console.log(" [DEBUG] USING DIRECT CHROMA DB LINK");




const client = new ChromaClient({
  host: "my-chromadb-server.onrender.com",
  port: 443,
  ssl: true,
});

try {
  const hb = await client.heartbeat();
  console.log("Heartbeat:", hb);
} catch (e) {
  console.error("Heartbeat failed");
  console.error(e);
}

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

try {
  const collection = await client.getOrCreateCollection({
    name: "repo_memory",
    embeddingFunction: dummyEmbeddingFunction,
  });

  console.log("Collection created/opened:", collection.name);
} catch (err) {
  console.error("Collection Error:", err);
}
