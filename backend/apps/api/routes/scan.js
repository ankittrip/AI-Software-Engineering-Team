import express from "express";
import crypto from "crypto";
import { scanQueue } from "../queue/scanQueue.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { prisma } from "../../../packages/prisma/index.js";

const router = express.Router();

const githubRepoRegex = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?/;

router.post("/new", verifyToken, async (req, res) => {
  try {
    const { repoUrl, skipCache = true } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    if (!githubRepoRegex.test(repoUrl)) {
      return res.status(400).json({ error: "Invalid GitHub repository URL" });
    }

    const baseJobId = crypto
      .createHash("sha256")
      .update(`${userId}-${repoUrl}`)
      .digest("hex");

    const jobId = skipCache ? `${baseJobId}-${Date.now()}` : baseJobId;

    if (!skipCache) {
      const existingJob = await scanQueue.getJob(jobId);

      if (existingJob) {
        const state = await existingJob.getState();

        if (state === "waiting" || state === "active") {
          return res.status(409).json({
            error: "A scan for this repository is already running.",
          });
        }

        if (state === "completed" || state === "failed") {
          await existingJob.remove();
        }
      }
    }

    console.log("[API BODY]", req.body);
    console.log("[SKIP CACHE]", skipCache);

    const job = await scanQueue.add(
      "github-scan-job",
      {
        repoUrl,
        userId,
        skipCache,
      },
      {
        jobId,
        removeOnComplete: 50,
        removeOnFail: 20,
      }
    );

    console.log(`[API] Scan queued. Job ID: ${job.id}`);

    return res.status(202).json({
      status: "success",
      message: "Scan has been queued successfully",
      jobId: job.id,
    });
  } catch (error) {
    console.error("Queue Error:", error);
    return res.status(500).json({ error: "Failed to queue the scan" });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const userScans = await prisma.scan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        repoUrl: true,
        repoOwner: true,
        repoName: true,
        status: true,
        overallScore: true,
        riskLevel: true,
        createdAt: true,
      }
    });

    const completedScans = userScans.filter(
      (scan) => scan.status === "COMPLETED" && scan.overallScore != null
    );

    const avgScore =
      completedScans.length > 0
        ? Math.round(
            completedScans.reduce((acc, curr) => acc + curr.overallScore, 0) /
              completedScans.length
          )
        : 0;

    const criticalCount = userScans.filter(
      (scan) => scan.riskLevel === "CRITICAL" || scan.riskLevel === "HIGH"
    ).length;

    return res.status(200).json({
      status: "success",
      stats: {
        totalReposScanned: userScans.length,
        avgSecurityScore: avgScore,
        criticalIssues: criticalCount,
        agentsOnline: "5/5",
      },
      history: userScans,
    });
  } catch (error) {
    console.error("Fetch History Error:", error);
    return res.status(500).json({ error: "Failed to fetch scan history" });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const scan = await prisma.scan.findUnique({ where: { id: req.params.id } });

    if (!scan) {
      return res.status(404).json({ error: "Scan not found" });
    }

    if (scan.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized access to this scan" });
    }

    return res.status(200).json({ status: "success", data: scan });
  } catch (error) {
    console.error("Fetch Scan Error:", error);
    return res.status(500).json({ error: "Failed to fetch scan details" });
  }
});

export default router;