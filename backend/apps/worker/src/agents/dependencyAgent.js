export const runDependencyAgent = async (repoContext) => {
  console.log("[Dependency Agent] Running rule-based dependency analysis...");

  try {
    const dependencies = {
      ...(repoContext.packageJson?.dependencies || {}),
      ...(repoContext.packageJson?.devDependencies || {}),
    };

    const files = (repoContext.importantFiles || []).map((f) =>
      f.path.toLowerCase()
    );

    const strengths = [];
    const securityRisks = [];
    const outdatedPackages = [];
    const missingEssentials = [];
    const observations = [];

    let score = 100;

    // =====================================
    // Technology Strengths
    // =====================================

    if (dependencies.react) {
      strengths.push({
        finding: "React detected",
        confidence: 1,
        evidence: ["package.json -> react"],
      });
    }

    if (dependencies.express) {
      strengths.push({
        finding: "Express.js backend detected",
        confidence: 1,
        evidence: ["package.json -> express"],
      });
    }

    if (dependencies.mongoose) {
      strengths.push({
        finding: "MongoDB/Mongoose stack detected",
        confidence: 1,
        evidence: ["package.json -> mongoose"],
      });
    }

    if (dependencies.prisma) {
      strengths.push({
        finding: "Prisma ORM detected",
        confidence: 1,
        evidence: ["package.json -> prisma"],
      });
    }

    const hasTypeScript =
      !!dependencies.typescript ||
      files.some((f) => f.endsWith("tsconfig.json"));

    if (hasTypeScript) {
      strengths.push({
        finding: "TypeScript detected",
        confidence: 1,
        evidence: ["package.json -> typescript or tsconfig.json"],
      });
    }

    if (dependencies.tailwindcss) {
      strengths.push({
        finding: "Tailwind CSS detected",
        confidence: 1,
        evidence: ["package.json -> tailwindcss"],
      });
    }

    if (dependencies.vite) {
      strengths.push({
        finding: "Vite build system detected",
        confidence: 1,
        evidence: ["package.json -> vite"],
      });
    }

    // =====================================
    // Deprecated / Legacy Packages
    // =====================================

    const deprecatedPackages = [
      "request",
      "moment",
      "node-sass",
      "uuidv4",
      "left-pad",
    ];

    deprecatedPackages.forEach((pkg) => {
      if (dependencies[pkg]) {
        outdatedPackages.push({
          package: pkg,
          reason:
            "Package is widely considered deprecated, legacy, or replaced by modern alternatives.",
          confidence: 0.9,
        });

        score -= 10;
      }
    });

    // =====================================
    // Tooling Detection
    // =====================================

    const hasVite =
      !!dependencies.vite || files.some((f) => f.includes("vite.config"));
    const hasWebpack = !!dependencies.webpack;
    const hasEslint =
      !!dependencies.eslint || files.some((f) => f.includes("eslint"));
    const hasPrettier = !!dependencies.prettier;

    const hasTesting =
      !!dependencies.jest ||
      !!dependencies.vitest ||
      !!dependencies.mocha ||
      !!dependencies.cypress ||
      !!dependencies.playwright ||
      !!dependencies["@testing-library/react"];

    // =====================================
    // Observations
    // =====================================

    if (!hasEslint) {
      observations.push("No ESLint configuration detected.");
    }

    if (!hasPrettier) {
      observations.push("Prettier formatting tool not detected.");
    }

    if (!hasTesting) {
      observations.push("No automated testing framework detected.");
    }

    if (!hasVite && !hasWebpack) {
      observations.push("No frontend build tool detected.");
    }

    // =====================================
    // Security Checks
    // =====================================

    if (dependencies.jsonwebtoken) {
      observations.push("JWT authentication library detected.");
    }

    if (dependencies.express && !dependencies.helmet) {
      securityRisks.push({
        finding: "Helmet middleware not detected for Express application.",
        severity: "MEDIUM",
        confidence: 0.9,
        evidence: ["express detected", "helmet not detected"],
      });

      score -= 5;
    }

    if (dependencies.express && !dependencies["express-rate-limit"]) {
      securityRisks.push({
        finding: "Rate limiting middleware not detected.",
        severity: "MEDIUM",
        confidence: 0.8,
        evidence: ["express detected", "express-rate-limit not detected"],
      });

      score -= 5;
    }

    // =====================================
    // Recommendations
    // =====================================

    if (!hasTesting) {
      missingEssentials.push({
        package: "testing-framework",
        reason: "Consider adding Jest, Vitest, Cypress, or Playwright.",
        confidence: 1,
      });
    }

    if (!hasPrettier) {
      missingEssentials.push({
        package: "prettier",
        reason: "Consider adding Prettier for consistent code formatting.",
        confidence: 1,
      });
    }

    // =====================================
    // Final Score
    // =====================================

    score = Math.max(0, Math.min(100, score));

    console.log(`[Dependency Agent] Health score: ${score}`);

    return {
      dependencyHealthScore: score,
      strengths,
      securityRisks,
      outdatedPackages,
      missingEssentials,
      observations,
    };
  } catch (error) {
    console.error(`[Dependency Agent] Failed: ${error.message}`);

    return {
      dependencyHealthScore: 0,
      strengths: [],
      securityRisks: [],
      outdatedPackages: [],
      missingEssentials: [],
      observations: [`Dependency analysis failed: ${error.message}`],
    };
  }
};