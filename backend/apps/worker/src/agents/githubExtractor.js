import axios from "axios";

export const fetchRepoContext = async (repoUrl) => {
  try {
    const [owner, repo] = repoUrl
      .replace("https://github.com/", "")
      .replace(".git", "")
      .split("/");

    console.log(`[Extractor] Fetching repository data for ${owner}/${repo}...`);

    const token = process.env.GITHUB_TOKEN;
    const apiConfig = {
      headers: { 
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
    
    const rawConfig = {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };

    const repoInfo = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      apiConfig
    );

    const defaultBranch = repoInfo.data.default_branch || "main";
    console.log(`[Extractor] Default branch: ${defaultBranch}`);

    const [readmeRes, treeRes] = await Promise.allSettled([
      axios.get(
        `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/README.md`,
        rawConfig
      ),
      axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
        apiConfig
      ),
    ]);

    const readme =
      readmeRes.status === "fulfilled" ? readmeRes.value.data : "No README found";

    const fileTree =
      treeRes.status === "fulfilled" ? treeRes.value.data.tree : [];

    console.log(`[Extractor] Total files discovered: ${fileTree.length}`);

    const packageJsonPaths = fileTree
      .filter((file) => file.type === "blob" && file.path.endsWith("package.json"))
      .map((file) => file.path);

    console.log(`[Extractor] package.json files found: ${packageJsonPaths.length}`);

    const packageFiles = await Promise.all(
      packageJsonPaths.map(async (packagePath) => {
        try {
          const response = await axios.get(
            `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${packagePath}`,
            rawConfig
          );
          return response.data;
        } catch {
          return null;
        }
      })
    );

    const mergedPackageJson = { dependencies: {}, devDependencies: {} };

    packageFiles.filter(Boolean).forEach((pkg) => {
      Object.assign(mergedPackageJson.dependencies, pkg.dependencies || {});
      Object.assign(mergedPackageJson.devDependencies, pkg.devDependencies || {});
    });

    console.log(
      `[Extractor] Dependencies merged — ${Object.keys(mergedPackageJson.dependencies).length} prod, ` +
      `${Object.keys(mergedPackageJson.devDependencies).length} dev`
    );

    const importantKeywords = [
      "controller", "route", "middleware", "service", "model", "auth",
      "config", "page", "component", "hook", "context", "store", "api",
      "utils", "helper", "feature", "module", "screen", "view", "layout",
      "lib", "core", "provider", "repository",
    ];

    const importantPaths = fileTree
      .filter((file) => {
        if (file.type !== "blob") return false;

        const path = file.path.toLowerCase();

        return (
          importantKeywords.some((keyword) => path.includes(keyword)) ||
          path.endsWith("server.js") ||
          path.endsWith("index.js") ||
          path.endsWith("app.js") ||
          path.endsWith("package.json") ||
          path.endsWith("tsconfig.json") ||
          path.endsWith("vite.config.js") ||
          path.endsWith("next.config.js") ||
          path.endsWith("dockerfile") ||
          path.endsWith("docker-compose.yml") ||
          path.endsWith(".env.example") ||
          path.endsWith("readme.md")
        );
      })
      .map((file) => {
        const path = file.path.toLowerCase();

        let score = 0;

        if (path.includes("controller")) score += 10;
        if (path.includes("route")) score += 10;
        if (path.includes("service")) score += 10;
        if (path.includes("model")) score += 10;
        if (path.includes("middleware")) score += 10;

        if (path.includes("auth")) score += 8;
        if (path.includes("config")) score += 8;

        if (path.endsWith("package.json")) score += 25;
        if (path.endsWith("readme.md")) score += 25;

        if (path.endsWith("server.js")) score += 20;
        if (path.endsWith("app.js")) score += 20;
        if (path.endsWith("index.js")) score += 15;

        return { ...file, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
      
    console.log(
      "[Extractor] Selected files:",
      importantPaths.map((f) => f.path)
    );

    const importantFiles = await Promise.all(
      importantPaths.map(async (file) => {
        try {
          const response = await axios.get(
            `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file.path}`,
            rawConfig
          );

          return {
            path: file.path,
            content:
              typeof response.data === "string"
                ? response.data.substring(0, 5000)
                : JSON.stringify(response.data, null, 2),
          };
        } catch {
          console.warn(`[Extractor] Could not fetch file: ${file.path}`);
          return null;
        }
      })
    );

    const filteredFiles = importantFiles.filter(Boolean);
    console.log(`[Extractor] Files sent to agents: ${filteredFiles.length}`);

    return {
      repoOwner: owner,
      repoName: repo,
      defaultBranch,
      readme,
      packageJson: mergedPackageJson,
      fileCount: fileTree.length,
      importantFiles: filteredFiles,
    };
  } catch (error) {
    console.error(`[Extractor] Failed to fetch repository data: ${error.message}`);
    throw new Error("Failed to extract repository data due to GitHub API error or invalid URL.");
  }
};