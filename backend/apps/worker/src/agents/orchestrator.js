import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

export const runOrchestrator = async (agentData) => {
  const scores = [
    agentData.architecture?.architectureScore,
    agentData.security?.securityScore,
    agentData.codeReview?.codeQualityScore,
    agentData.performance?.performanceScore,
    agentData.dependencies?.healthScore,
  ].filter(score => typeof score === 'number');

  const calculatedBaseScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
    : 0;

  const compactAgentData = {
    architecture: {
      score: agentData.architecture?.architectureScore,
      observations: agentData.architecture?.observations?.slice(0, 5) || [],
    },
    security: {
      score: agentData.security?.securityScore,
      criticalThreats: agentData.security?.criticalThreats?.slice(0, 10) || [],
      recommendations: agentData.security?.securityRecommendations?.slice(0, 5) || [],
    },
    codeReview: {
      score: agentData.codeReview?.codeQualityScore,
      issues: agentData.codeReview?.majorIssues?.slice(0, 10) || [],
    },
    performance: {
      score: agentData.performance?.performanceScore,
      bottlenecks: agentData.performance?.bottlenecks?.slice(0, 10) || [],
    },
    dependencies: {
      score: agentData.dependencies?.healthScore,
      issues: agentData.dependencies?.issues?.slice(0, 10) || [],
    },
  };

  const prompt = `
You are the Lead Software Architect.
Analyze findings from all specialized agents and produce a final executive report.

Current Scan Results:
${JSON.stringify(compactAgentData, null, 2)}

Historical & Comparison Data (RAG Memory):
- Security Context: ${JSON.stringify((agentData.historicalSecurityContext || []).slice(0, 3))}
- Architecture Context: ${JSON.stringify((agentData.historicalArchitectureContext || []).slice(0, 3))}
- Code Review Context: ${JSON.stringify((agentData.historicalCodeReviewContext || []).slice(0, 3))}
- Performance Context: ${JSON.stringify((agentData.historicalPerformanceContext || []).slice(0, 3))}

- Security Comparison: ${JSON.stringify(agentData.securityComparison || {})}
- Scan Comparison: ${JSON.stringify(agentData.scanComparison || {})}

Instructions:
1. Synthesize all agent outputs into a unified executive summary.
2. The statistically calculated base score for this repo is ${calculatedBaseScore}/100.
3. You must determine the final "overallScore". You can keep it as ${calculatedBaseScore}, or adjust it slightly up/down based on severe recurring threats or major improvements.
4. Determine the "riskLevel" (LOW, MEDIUM, HIGH, CRITICAL) strictly based on the final overallScore and the presence of critical threats.
5. Base your strengths and weaknesses explicitly on the provided data. Do not hallucinate.

You MUST output valid JSON only in this exact structure:
{
  "overallScore": number,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": string,
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": string[]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are the final Orchestrator. Output pure JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const rawContent = response.choices[0].message.content;
    
    try {
      const llmResult = JSON.parse(rawContent);
      
      return {
        ...agentData,
        ...llmResult
      };

    } catch (parseError) {
      console.error("[Orchestrator] Failed to parse LLM JSON:", rawContent);
      
      return {
        ...agentData,
        overallScore: calculatedBaseScore,
        riskLevel: "MEDIUM",
        summary: "Analysis completed, but failed to parse detailed AI summary. Please check individual agent logs.",
        strengths: ["Scan completed successfully"],
        weaknesses: ["AI synthesis formatting error"],
        recommendations: ["Review individual agent metrics for details."]
      };
    }

  } catch (apiError) {
    console.error("[Orchestrator] LLM API Call Failed:", apiError);
    throw new Error("Orchestration failed due to LLM API error.");
  }
};