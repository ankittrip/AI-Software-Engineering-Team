import OpenAI from "openai";

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

    const hasHelmet = !!dependencies.helmet;
    const hasRateLimit = !!dependencies["express-rate-limit"];
    const hasCors = !!dependencies.cors;
    const hasJWT = !!dependencies.jsonwebtoken;
    
    const hasHashing = !!(dependencies.bcrypt || dependencies.bcryptjs || dependencies.crypto || dependencies.argon2);

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

    if (hasHashing) {
      securityScore = Math.min(100, securityScore + 5);
    } else {
      minorWarnings.push("No standard cryptographic hashing library (crypto/bcrypt) detected.");
      securityScore -= 5;
    }

    const secretPatterns = [
      /mongodb\+srv:\/\/[^:]+:[^@]+@/i,
      /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][a-zA-Z0-9-_]{8,}['"]/i,
      /private[_-]?key\s*[:=]\s*['"].+['"]/i,
    ];

    for (const file of files) {
      const content = file.content || "";
      const foundSecret = secretPatterns.some((pattern) => pattern.test(content));

      if (foundSecret) {
        criticalThreats.push(`Potential hardcoded secret exposure detected in ${file.path}`);
        securityScore -= 20;
      }
    }

    securityScore = Math.max(0, Math.min(100, securityScore));

    const fileContentsContext = files
      .slice(0, 10)
      .map(f => `--- File: ${f.path} ---\n${f.content.substring(0, 800)}`)
      .join("\n\n");

    const prompt = `
You are a Senior Security Architect.

Detected Security Facts:
Security Score: ${securityScore}
Critical Threats: ${JSON.stringify(criticalThreats)}
Warnings: ${JSON.stringify(minorWarnings)}

Key Repository File Snippets:
${fileContentsContext}

Generate ONLY JSON:
{
  "securityObservations": [],
  "additionalRecommendations": [],
  "aiDetectedThreats": []
}

Rules:
- Identify logical vulnerabilities (e.g., SQL Injection, XSS, broken access control) in the provided code snippets.
- Populate "aiDetectedThreats" if you find severe vulnerabilities in the code.
- No guessing. Evidence-based only.
- Output pure JSON only.
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

    const rawContent = response.choices[0].message.content;
    let aiResult = { securityObservations: [], additionalRecommendations: [], aiDetectedThreats: [] };
    
    try {
      aiResult = JSON.parse(rawContent);
    } catch (e) {
      console.error("[Security Agent] Failed to parse LLM JSON:", e);
    }

    return {
      securityScore,
      criticalThreats: [...criticalThreats, ...(aiResult.aiDetectedThreats || [])],
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
      criticalThreats: [`Agent execution failed: ${error.message}`],
      minorWarnings: [],
      securityRecommendations: ["Review logs for agent failure details."],
      securityObservations: [],
    };
  }
};