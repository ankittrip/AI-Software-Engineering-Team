export const runArchitectureAgent = async (repoContext) => {
  console.log("[Architecture Agent] Starting analysis...");

  try {
    // =====================================
    // STEP 1: Rule-Based Detection
    // =====================================

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

    // =====================================
    // STEP 2: AI Analysis
    // =====================================

    const prompt = `
You are a Senior Software Architect.

Detected Facts:

Tech Stack:
${techStack.join(", ")}

Architecture Pattern:
${architecturePattern}

Repository Files:
${files.slice(0, 20).join("\n")}

Generate ONLY JSON:

{
  "architecturalObservations": [],
  "strengths": [],
  "risks": []
}

Rules:

- Do not repeat detected technologies.
- Focus on architecture quality.
- No guessing.
- Evidence-based observations only.
- JSON only.
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
              content: "You are a strict Software Architect. Output JSON only.",
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

    return {
      techStack,
      architecturePattern,
      architecturalObservations: aiResult.architecturalObservations || [],
      strengths: aiResult.strengths || [],
      risks: aiResult.risks || [],
    };
  } catch (error) {
    console.error(`[Architecture Agent] Failed: ${error.message}`);

    return {
      techStack: [],
      architecturePattern: "UNKNOWN",
      architecturalObservations: [error.message],
      strengths: [],
      risks: [],
    };
  }
};