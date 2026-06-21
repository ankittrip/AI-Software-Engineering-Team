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

    if (dependencies.react) {
      strengths.push({ finding: "React detected", confidence: 1 });
    }
    if (dependencies.express) {
      strengths.push({ finding: "Express.js backend detected", confidence: 1 });
    }
    if (dependencies.mongoose) {
      strengths.push({ finding: "MongoDB/Mongoose stack detected", confidence: 1 });
    }
    if (dependencies.prisma) {
      strengths.push({ finding: "Prisma ORM detected", confidence: 1 });
    }

    const hasTypeScript =
      !!dependencies.typescript ||
      files.some((f) => f.endsWith("tsconfig.json"));

    if (hasTypeScript) {
      strengths.push({ finding: "TypeScript detected", confidence: 1 });
    }
    if (dependencies.tailwindcss) {
      strengths.push({ finding: "Tailwind CSS detected", confidence: 1 });
    }
    if (dependencies.vite) {
      strengths.push({ finding: "Vite build system detected", confidence: 1 });
    }

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
          reason: "Package is widely considered deprecated or legacy.",
        });
        score -= 10;
      }
    });

    const hasVite = !!dependencies.vite || files.some((f) => f.includes("vite.config"));
    const hasWebpack = !!dependencies.webpack;
    const hasEslint = !!dependencies.eslint || files.some((f) => f.includes("eslint"));
    const hasPrettier = !!dependencies.prettier;

    const hasTesting =
      !!dependencies.jest ||
      !!dependencies.vitest ||
      !!dependencies.mocha ||
      !!dependencies.cypress ||
      !!dependencies.playwright ||
      !!dependencies["@testing-library/react"];

    if (!hasEslint) observations.push("No ESLint configuration detected.");
    if (!hasPrettier) observations.push("Prettier formatting tool not detected.");
    if (!hasTesting) observations.push("No automated testing framework detected.");
    if (!hasVite && !hasWebpack) observations.push("No frontend build tool detected.");

    if (dependencies.jsonwebtoken) {
      observations.push("JWT authentication library detected.");
    }

    if (dependencies.express && !dependencies.helmet) {
      securityRisks.push({
        finding: "Helmet middleware not detected for Express application.",
      });
      score -= 5;
    }

    if (dependencies.express && !dependencies["express-rate-limit"]) {
      securityRisks.push({
        finding: "Rate limiting middleware not detected.",
      });
      score -= 5;
    }

    if (!hasTesting) {
      missingEssentials.push({
        package: "testing-framework",
        reason: "Consider adding Jest, Vitest, Cypress, or Playwright.",
      });
    }

    if (!hasPrettier) {
      missingEssentials.push({
        package: "prettier",
        reason: "Consider adding Prettier for consistent code formatting.",
      });
    }

    score = Math.max(0, Math.min(100, score));
    console.log(`[Dependency Agent] Health score: ${score}`);

    const combinedIssues = [
      ...securityRisks.map(r => `Security: ${r.finding}`),
      ...outdatedPackages.map(o => `Outdated: ${o.package} - ${o.reason}`),
      ...missingEssentials.map(m => `Missing: ${m.package} - ${m.reason}`),
      ...observations.map(o => `Observation: ${o}`)
    ];

    return {
      healthScore: score,
      issues: combinedIssues,
      strengths,
      securityRisks,
      outdatedPackages,
      missingEssentials,
      observations,
    };
  } catch (error) {
    console.error(`[Dependency Agent] Failed: ${error.message}`);

    return {
      healthScore: 50,
      issues: [`Dependency analysis failed: ${error.message}`],
      strengths: [],
      securityRisks: [],
      outdatedPackages: [],
      missingEssentials: [],
      observations: [],
    };
  }
};