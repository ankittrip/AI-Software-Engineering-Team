import { getHistoricalArchitectureContext } from "../rag/getHistoricalArchitectureContext.js";

export const runArchitectureAgent = async (repoContext) => {
  console.log("[Architecture Agent] Starting analysis...");

  try {
    const dependencies = {
      ...(repoContext.packageJson?.dependencies || {}),
      ...(repoContext.packageJson?.devDependencies || {}),
    };

    const files = (repoContext.importantFiles || []).map((f) =>
      f.path.toLowerCase()
    );

    const techStack = [];

    if (dependencies.react) techStack.push("React");
    if (dependencies.next) techStack.push("Next.js");
    if (dependencies.express) techStack.push("Express.js");
    if (dependencies.mongoose) techStack.push("MongoDB");
    if (dependencies.prisma) techStack.push("Prisma");
    if (dependencies.typescript) techStack.push("TypeScript");
    if (dependencies["socket.io"]) techStack.push("Socket.IO");
    if (dependencies.tailwindcss) techStack.push("Tailwind CSS");
    if (dependencies.vite) techStack.push("Vite");
    if (dependencies.redis || dependencies.ioredis) techStack.push("Redis");

    const hasControllers = files.some((f) => f.includes("controller"));
    const hasModels = files.some((f) => f.includes("model"));
    const hasRoutes = files.some((f) => f.includes("route"));
    const hasServices = files.some((f) => f.includes("service"));

    let architecturePattern = "Unknown";

    if (hasControllers && hasModels && hasRoutes) {
      architecturePattern = "MVC";
    } else if (hasServices && hasControllers) {
      architecturePattern = "Layered Architecture";
    }

    console.log(`[Architecture Agent] Tech stack: ${techStack.join(", ")}`);
    console.log(`[Architecture Agent] Pattern: ${architecturePattern}`);

    const fileContentsContext = (repoContext.importantFiles || [])
      .slice(0, 5)
      .map((f) => `--- File: ${f.path} ---\n${f.content.substring(0, 1000)}`)
      .join("\n\n");

    let historicalIssues = "No previous architecture issues found.";
    let pastArchitectureContext = [];
    
    try {
      const pastContext = await getHistoricalArchitectureContext(repoContext.repoUrl);
      if (pastContext && pastContext.length > 0) {
        historicalIssues = pastContext.map((issue) => `- ${issue.finding}`).join("\n");
        pastArchitectureContext = pastContext;
        console.log(`[Architecture RAG] Found ${pastContext.length} past issues`);
      }
    } catch (error) {
      console.log("[Architecture RAG] Skipped:", error.message);
    }

    const prompt = `
You are a Senior Software Architect.

HISTORICAL CONTEXT (Past Architecture Issues from this repo):
${historicalIssues}

TASK:
Analyze the repository. If a past issue is still present, set "isRecurring": true. If new, set "isRecurring": false.

Detected Facts:

Tech Stack:
${techStack.join(", ")}

Architecture Pattern:
${architecturePattern}

Key Repository File Snippets:
${fileContentsContext}

Generate ONLY JSON:
{
  "architectureScore": number, 
  "architecturalObservations": [
    {
      "observation": "",
      "isRecurring": false
    }
  ],
  "strengths": [],
  "risks": [
    {
      "description": "",
      "isRecurring": false
    }
  ]
}

Rules:
- Calculate an architectureScore between 0 and 100 based on code quality and patterns.
- Focus on architecture quality, modularity, and tight-coupling.
- No guessing.
- Evidence-based observations only.
- Output pure JSON only.
`;

    const response = await fetch(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a strict Software Architect. Output pure JSON only.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Architecture agent failed: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    const aiResult = JSON.parse(rawContent);

    console.log("[Architecture DEBUG] Score:", aiResult.architectureScore);
    console.log(
      "[Architecture DEBUG] risks:",
      JSON.stringify(aiResult.risks).substring(0, 100) + "..."
    );

    return {
      architectureScore: aiResult.architectureScore || 80,
      techStack,
      architecturePattern,
      architecturalObservations: aiResult.architecturalObservations || [],
      strengths: aiResult.strengths || [],
      risks: aiResult.risks || [],
      historicalContext: pastArchitectureContext,
    };
  } catch (error) {
    console.error(`[Architecture Agent] Failed: ${error.message}`);

    return {
      architectureScore: 50,
      techStack: [],
      architecturePattern: "UNKNOWN",
      architecturalObservations: [{ observation: error.message, isRecurring: false }],
      strengths: [],
      risks: [],
    };
  }
};