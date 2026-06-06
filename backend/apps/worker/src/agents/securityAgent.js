import OpenAI from "openai";

// Instantiated at module level to reuse the connection across calls
const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

export const runSecurityAgent = async (repoContext) => {
  console.log("[Security Agent] Starting analysis...");

  try {
    const dependencies = {
      ...(repoContext.packageJson?.dependencies || {}),
      ...(repoContext.packageJson?.devDependencies || {}),
    };

    const files = repoContext.importantFiles || [];

    const criticalThreats = [];
    const minorWarnings = [];
    const securityRecommendations = [];

    let securityScore = 100;

    // =====================================
    // Rule-Based Checks
    // =====================================

    const hasHelmet = !!dependencies.helmet;
    const hasRateLimit = !!dependencies["express-rate-limit"];
    const hasCors = !!dependencies.cors;
    const hasJWT = !!dependencies.jsonwebtoken;

    if (!hasHelmet && dependencies.express) {
      minorWarnings.push("Helmet middleware not detected.");
      securityScore -= 10;
    }

    if (!hasRateLimit && dependencies.express) {
      minorWarnings.push("Rate limiting middleware not detected.");
      securityScore -= 15;
    }

    if (!hasCors && dependencies.express) {
      minorWarnings.push("CORS package not detected.");
      securityScore -= 10;
    }

    if (hasJWT) {
      securityRecommendations.push(
        "Verify JWT secret strength and expiration strategy."
      );
    }

    // Scan file contents for hardcoded secrets or sensitive patterns
    const secretPatterns = [
      /mongodb\+srv:\/\//i,
      /api[_-]?key/i,
      /secret/i,
      /token/i,
      /password/i,
      /private[_-]?key/i,
    ];

    for (const file of files) {
      const content = file.content || "";
      const foundSecret = secretPatterns.some((pattern) => pattern.test(content));

      if (foundSecret) {
        criticalThreats.push(`Potential secret exposure detected in ${file.path}`);
        securityScore -= 20;
      }
    }

    securityScore = Math.max(0, Math.min(100, securityScore));

    // =====================================
    // AI Insights
    // =====================================

    const prompt = `
You are a Senior Security Architect.

Detected Security Facts:

Security Score:
${securityScore}

Critical Threats:
${JSON.stringify(criticalThreats, null, 2)}

Warnings:
${JSON.stringify(minorWarnings, null, 2)}

Repository Files:

${files.slice(0, 15).map((f) => f.path).join("\n")}

Generate ONLY JSON:

{
  "securityObservations": [],
  "additionalRecommendations": []
}

Rules:
- No guessing
- Evidence-based only
- JSON only
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a strict Security Architect. Output JSON only.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const aiResult = JSON.parse(response.choices[0].message.content);

    return {
      securityScore,
      criticalThreats,
      minorWarnings,
      securityRecommendations: [
        ...securityRecommendations,
        ...(aiResult.additionalRecommendations || []),
      ],
      securityObservations: aiResult.securityObservations || [],
    };
  } catch (error) {
    console.error(`[Security Agent] Failed: ${error.message}`);

    return {
      securityScore: 0,
      criticalThreats: [],
      minorWarnings: [],
      securityRecommendations: [error.message],
      securityObservations: [],
    };
  }
};