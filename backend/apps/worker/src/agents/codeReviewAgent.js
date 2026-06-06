import OpenAI from "openai";

// Instantiated at module level to reuse the connection across calls
const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

export const runCodeReviewAgent = async (repoContext) => {
  console.log(`[Code Review Agent] Analyzing ${repoContext.importantFiles?.length || 0} files...`);

  const importantFilesText = (repoContext.importantFiles || [])
    .slice(0, 10)
    .map(
      (file) => `
=========================================
FILE: ${file.path}
=========================================

${file.content?.substring(0, 1500) || ""}
`
    )
    .join("\n\n");

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

Repository Information:

README:
${repoContext.readme?.substring(0, 2000) || "Not Available"}

PACKAGE.JSON:
${JSON.stringify(repoContext.packageJson || {}, null, 2)}

SOURCE FILES:

${importantFilesText}

Return ONLY this JSON format:

{
  "codeQualityScore": 0,
  "overallRating": "Excellent | Good | Fair | Poor",

  "strengths": [
    {
      "finding": "",
      "confidence": 0,
      "evidence": []
    }
  ],

  "issues": [
    {
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "finding": "",
      "confidence": 0,
      "evidence": []
    }
  ],

  "bestPracticesObserved": [],

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
- Output JSON only.`,
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content);
};