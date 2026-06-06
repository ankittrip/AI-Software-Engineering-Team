import OpenAI from "openai";

// Instantiated at module level to reuse the connection across calls
const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

export const runPerformanceAgent = async (repoContext) => {
  console.log("[Performance Agent] Analyzing performance bottlenecks...");

  const prompt = `
    You are an expert Performance Optimization Engineer.
    Analyze the following repository context to identify potential performance bottlenecks, inefficient rendering, and optimization opportunities.
    
    Repository Context:
    - README: ${repoContext.readme.substring(0, 1500)}
    - Package.json: ${JSON.stringify(repoContext.packageJson)}

    Focus on identifying:
    1. Inefficient rendering strategies or lack of optimization (e.g., missing SSR/SSG setups, heavy client-side rendering).
    2. Missing caching layers (like Redis or CDN usage) where they would typically be needed.
    3. Dependencies that are known to heavily impact bundle size or load time.
    4. Actionable performance optimization recommendations.

    You MUST output valid JSON only, exactly matching this structure:
    {
      "performanceScore": "String (e.g., Excellent, Moderate, Needs Improvement)",
      "bottlenecks": [ "array of identified performance issues or slow operations" ],
      "optimizationTips": [ "array of actionable tips to improve speed and efficiency" ]
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a strict Performance Analyzer AI. Output pure JSON only." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
};