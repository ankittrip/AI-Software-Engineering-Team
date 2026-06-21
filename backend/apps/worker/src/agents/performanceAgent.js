import OpenAI from "openai";
import { getHistoricalPerformanceContext } from "../rag/getHistoricalPerformanceContext.js";

const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

export const runPerformanceAgent = async (repoContext) => {
  console.log("[Performance Agent] Analyzing performance bottlenecks...");

  try {
    const packageJsonString = JSON.stringify(repoContext.packageJson || {}).substring(0, 1500);

    const fileContentsContext = (repoContext.importantFiles || [])
      .slice(0, 10)
      .map(f => `--- File: ${f.path} ---\n${f.content?.substring(0, 800) || ""}`)
      .join("\n\n");

    let historicalIssues = "No previous performance issues found.";
    let pastPerformanceContext = [];
    
    try {
      const pastContext = await getHistoricalPerformanceContext(repoContext.repoUrl);
      if (pastContext && pastContext.length > 0) {
        historicalIssues = pastContext.map(issue => `- ${issue.finding}`).join("\n");
        pastPerformanceContext = pastContext;
        console.log(`[Performance RAG] Found ${pastContext.length} past issues`);
      }
    } catch (error) {
      console.log("[Performance RAG] Skipped:", error.message);
    }

    const prompt = `
You are an expert Performance Optimization Engineer.

HISTORICAL CONTEXT (Past Performance Issues from this repo):
${historicalIssues}

Analyze the following repository context to identify potential performance bottlenecks, inefficient rendering, and optimization opportunities.

Repository Context:
- README: ${(repoContext.readme || "").substring(0, 1500)}
- Package.json: ${packageJsonString}

Key Code Snippets:
${fileContentsContext}

Focus on identifying:
1. Code-level bottlenecks (e.g., N+1 database queries, heavy loops, synchronous blocking operations).
2. Inefficient rendering strategies (e.g., missing SSR/SSG setups, React re-render loops, missing memoization).
3. Missing caching layers (like Redis or CDN usage) where they would typically be needed.
4. Dependencies that are known to heavily impact bundle size or load time.
5. Actionable performance optimization recommendations.

TASK: If a past issue is still present, set "isRecurring": true on it. If new, set "isRecurring": false.

You MUST output valid JSON only, exactly matching this structure:
{
  "performanceScore": number,
  "performanceRating": "Excellent | Good | Fair | Poor",
  "bottlenecks": [
    {
      "issue": "Describe the slow operation or bottleneck",
      "impact": "High | Medium | Low",
      "isRecurring": boolean
    }
  ],
  "optimizationOpportunities": [
    {
      "suggestion": "Actionable tip to improve speed",
      "estimatedImpact": "High | Medium | Low"
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a strict Performance Analyzer AI. Output pure JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const rawContent = response.choices[0].message.content;
    const aiResult = JSON.parse(rawContent);

    return {
      ...aiResult,
      historicalContext: pastPerformanceContext,
    };

  } catch (error) {
    console.error(`[Performance Agent] Failed: ${error.message}`);

    return {
      performanceScore: 50,
      performanceRating: "Fair",
      bottlenecks: [
        {
          "issue": `Agent execution failed: ${error.message}`,
          "impact": "High"
        }
      ],
      optimizationOpportunities: [
        {
          "suggestion": "Review individual agent logs to determine why performance analysis failed.",
          "estimatedImpact": "High"
        }
      ],
      historicalContext: [],
    };
  }
};