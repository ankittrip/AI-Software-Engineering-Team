import axios from "axios";

export const fetchRepoContext = async (repoUrl) => {
  try {
    const [owner, repo] = repoUrl
      .replace("https://github.com/", "")
      .split("/");

    console.log(`[Extractor] Fetching repository data for ${owner}/${repo}...`);

    // ==================================
    // STEP 1: Repository Metadata
    // ==================================

    const repoInfo = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers: { Accept: "application/vnd.github+json" } }
    );

    const defaultBranch = repoInfo.data.default_branch || "main";

    console.log(`[Extractor] Default branch: ${defaultBranch}`);

    // ==================================
    // STEP 2: README + File Tree
    // ==================================

    const [readmeRes, treeRes] = await Promise.allSettled([
      axios.get(
        `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/README.md`
      ),
      axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`
      ),
    ]);

    const readme =
      readmeRes.status === "fulfilled" ? readmeRes.value.data : "No README found";

    const fileTree =
      treeRes.status === "fulfilled" ? treeRes.value.data.tree : [];

    console.log(`[Extractor] Total files discovered: ${fileTree.length}`);

    // ==================================
    // STEP 3: Find All package.json Files
    // ==================================

    const packageJsonPaths = fileTree
      .filter((file) => file.type === "blob" && file.path.endsWith("package.json"))
      .map((file) => file.path);

    console.log(`[Extractor] package.json files found: ${packageJsonPaths.length}`);

    // ==================================
    // STEP 4: Fetch All package.json Files
    // ==================================

    const packageFiles = await Promise.all(
      packageJsonPaths.map(async (packagePath) => {
        try {
          const response = await axios.get(
            `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${packagePath}`
          );
          return response.data;
        } catch {
          return null;
        }
      })
    );

    // ==================================
    // STEP 5: Merge Dependencies
    // ==================================

    const mergedPackageJson = { dependencies: {}, devDependencies: {} };

    packageFiles.filter(Boolean).forEach((pkg) => {
      Object.assign(mergedPackageJson.dependencies, pkg.dependencies || {});
      Object.assign(mergedPackageJson.devDependencies, pkg.devDependencies || {});
    });

    console.log(
      `[Extractor] Dependencies merged — ${Object.keys(mergedPackageJson.dependencies).length} prod, ` +
      `${Object.keys(mergedPackageJson.devDependencies).length} dev`
    );

    // ==================================
    // STEP 6: Important Files
    // ==================================

    const importantKeywords = [
      "controller", "route", "middleware", "service", "model",
      "auth", "config", "page", "component", "hook", "context", "store",
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
          path.endsWith(".env.example")
        );
      })
      .slice(0, 30);

    console.log(`[Extractor] Important paths selected: ${importantPaths.length}`);

    // ==================================
    // STEP 7: Fetch Important Files
    // ==================================

    const importantFiles = await Promise.all(
      importantPaths.map(async (file) => {
        try {
          const response = await axios.get(
            `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file.path}`
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

    // ==================================
    // STEP 8: Return Context
    // ==================================

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
    throw new Error("Failed to extract repository data");
  }
};