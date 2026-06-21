import OpenAI from "openai";
import { getHistoricalCodeReviewContext } from "../rag/getHistoricalCodeReviewContext.js";

// Instantiated at module level to reuse the connection across calls
const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

export const runCodeReviewAgent = async (repoContext) => {
  console.log(`[Code Review Agent] Analyzing ${repoContext.importantFiles?.length || 0} files...`);

  let pastCodeReviewContext = [];

  try {
    let historicalIssues = "No previous code review issues found.";
    
    try {
      const pastContext = await getHistoricalCodeReviewContext(repoContext.repoUrl);

      if (pastContext && pastContext.length > 0) {
        historicalIssues = pastContext.map((issue) => `- ${issue.finding}`).join("\n");
        pastCodeReviewContext = pastContext;
      }
    } catch (error) {
      console.log("[Code Review RAG] Memory fetch skipped/failed:", error.message);
    }

    const importantFilesText = (repoContext.importantFiles || [])
      .slice(0, 10)
      .map(
        (file) => `
=========================================
FILE: ${file.path}
=========================================

${file.content?.substring(0, 800) || ""}
`
      )
      .join("\n\n");

    const packageJsonString = JSON.stringify(repoContext.packageJson || {}, null, 2).substring(0, 1500);

    const prompt = `
You are a Senior Staff Engineer performing a professional code review.

IMPORTANT RULES:

1. NEVER guess.
2. ONLY report findings supported by evidence.
3. Every issue MUST contain:
   - severity
   - confidence
   - evidence
4. If evidence is insufficient, explicitly say so.
5. Prefer factual observations over generic advice.
6. Output valid JSON only.

HISTORICAL CONTEXT (Past Code Review Issues from this repo):
${historicalIssues}

TASK:
Analyze the source files. Pay special attention to the HISTORICAL CONTEXT. 
If a past issue is still present in the current code, include it in your 'codeSmells' array and explicitly set "isRecurring": true. If it is a new issue, set "isRecurring": false.

Repository Information:

README:
${repoContext.readme?.substring(0, 2000) || "Not Available"}

PACKAGE.JSON:
${packageJsonString}

SOURCE FILES:

${importantFilesText}

Return ONLY this JSON format:

{
  "codeQualityScore": number,
  "qualityRating": "Excellent | Good | Fair | Poor",

  "strengths": [
    {
      "finding": "",
      "confidence": number,
      "evidence": []
    }
  ],

  "codeSmells": [
    {
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "finding": "",
      "confidence": number,
      "evidence": [],
      "isRecurring": boolean
    }
  ],

  "bestPracticesObserved": [
    "string 1",
    "string 2"
  ],

  "refactoringSuggestions": [
    {
      "priority": "LOW | MEDIUM | HIGH",
      "action": "",
      "reason": ""
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a strict Senior Staff Engineer.

Rules:
- No assumptions.
- No generic recommendations.
- Every finding requires evidence.
- Output pure JSON only.`,
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const rawContent = response.choices[0].message.content;
    const aiResult = JSON.parse(rawContent);

    return {
      ...aiResult,
      historicalContext: pastCodeReviewContext,
    };

  } catch (error) {
    console.error(`[Code Review Agent] Failed: ${error.message}`);

    return {
      codeQualityScore: 50,
      qualityRating: "Fair",
      strengths: [],
      codeSmells: [
        {
          severity: "HIGH",
          finding: `Agent execution failed: ${error.message}`,
          confidence: 100,
          evidence: ["System Exception"],
          isRecurring: false
        }
      ],
      bestPracticesObserved: [],
      refactoringSuggestions: [],
      historicalContext: pastCodeReviewContext,
    };
  }
};