import { pipeline } from "@xenova/transformers";

let extractorPromise = null;

const getExtractor = () => {
  if (!extractorPromise) {
    console.log("[Embedding Service] Initializing model load...");
    
    extractorPromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    ).then((model) => {
      console.log("[Embedding Service] Model loaded successfully.");
      return model;
    }).catch((error) => {
      console.error("[Embedding Service] Failed to load model:", error);
      extractorPromise = null;
      throw error;
    });
  }

  return extractorPromise;
};

export const generateEmbedding = async (text) => {
  try {
    if (!text || typeof text !== "string" || text.trim() === "") {
      console.warn("[Embedding Service] Empty or invalid text provided. Returning zero vector.");
      return new Array(384).fill(0); 
    }

    const model = await getExtractor();

    const embedding = await model(text.trim(), {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(embedding.data);
  } catch (error) {
    console.error("[Embedding Service] Error generating embedding:", error);
    throw error;
  }
};