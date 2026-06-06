import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const client = new OpenAI({
  apiKey: process.env.LLAMA_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const analyzeRepositoryArchitecture = async (data) => {
  const fileTree = Array.isArray(data) ? data : data?.fileTree || [];
  const packageJson = data?.packageJson || {};

  console.log(`[Architecture Agent] Analyzing ${fileTree.length} files...`);

  const prompt = `
You are a Senior Software Architect.

Repository Information:

Package.json:
${JSON.stringify(packageJson, null, 2)}

Repository File Tree:
${JSON.stringify(fileTree.slice(0, 200), null, 2)}

Analyze this repository and return ONLY valid JSON.

Format:

{
  "frontend": "",
  "backend": "",
  "database": "",
  "authentication": "",
  "realtime": "",
  "storage": "",
  "architecture": "",
  "summary": ""
}
`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }],
    });

    // Strip markdown fences in case the model wraps output in ```json blocks
    const text = response.choices[0].message.content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(text);
  } catch (error) {
    console.error(`[Architecture Agent] Analysis failed: ${error.message}`);

    return {
      frontend: "Unknown",
      backend: "Unknown",
      database: "Unknown",
      authentication: "Unknown",
      realtime: "Unknown",
      storage: "Unknown",
      architecture: "Unknown",
      summary: "Analysis failed",
    };
  }
};