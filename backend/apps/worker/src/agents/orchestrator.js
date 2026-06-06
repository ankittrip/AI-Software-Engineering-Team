import OpenAI from "openai";

// Instantiated at module level to reuse the connection across calls
const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

export const runOrchestrator = async (agentData) => {
  const prompt = `
    You are the Lead Software Architect. 
    Analyze the findings from our 5 specialized AI agents and synthesize a final executive summary.

    Agent Findings:
    ${JSON.stringify(agentData, null, 2)}

    You MUST output valid JSON only, exactly matching this structure:
    {
      "overallScore": (number out of 100),
      "riskLevel": ("LOW", "MEDIUM", "HIGH", or "CRITICAL"),
      "summary": (1-2 sentence final verdict),
      "strengths": [ (array of strings) ],
      "weaknesses": [ (array of strings) ],
      "recommendations": [ (array of strings) ]
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are the final Orchestrator. Output pure JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
};