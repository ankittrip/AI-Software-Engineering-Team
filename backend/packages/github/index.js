import { Octokit } from "octokit";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const MAX_FILES = 50;

export const parseGithubUrl = (url) => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);

  if (!match) {
    throw new Error("Invalid GitHub URL");
  }

  return {
    owner: match[1],
    repo: match[2].replace(".git", "").replace("/", ""),
  };
};

export const getRepositoryTree = async (url) => {
  try {
    const { owner, repo } = parseGithubUrl(url);

    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: "true",
    });

    const fileTree = treeData.tree
      .filter((item) => item.type === "blob")
      .map((item) => item.path);

    let packageJson = {};

    // =================================
    // package.json extraction
    // =================================

    if (fileTree.includes("package.json")) {
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: "package.json",
        });

        packageJson = JSON.parse(
          Buffer.from(data.content, "base64").toString("utf8")
        );
      } catch {
        console.warn("[Octokit] Could not read package.json");
      }
    }

    // =================================
    // Source file extraction
    // =================================

    const codeFiles = fileTree
      .filter(
        (path) =>
          path.endsWith(".js") ||
          path.endsWith(".ts") ||
          path.endsWith(".jsx") ||
          path.endsWith(".tsx")
      )
      .slice(0, MAX_FILES);

    const fileResponses = await Promise.allSettled(
      codeFiles.map((path) => octokit.rest.repos.getContent({ owner, repo, path }))
    );

    const sourceFiles = [];

    fileResponses.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const data = result.value.data;

        if (data.content) {
          sourceFiles.push({
            path: codeFiles[index],
            content: Buffer.from(data.content, "base64").toString("utf8"),
          });
        }
      }
    });

    console.log(`[Octokit] Files found: ${fileTree.length}`);
    console.log(`[Octokit] Source files loaded: ${sourceFiles.length}`);

    return { fileTree, packageJson, sourceFiles };
  } catch (error) {
    if (error.status === 403 || error.message?.includes("quota")) {
      throw new Error("GitHub API rate limit exceeded.");
    }

    console.error(`[Octokit] Repository fetch failed: ${error.message}`);
    throw new Error("Could not analyze repository.");
  }
};