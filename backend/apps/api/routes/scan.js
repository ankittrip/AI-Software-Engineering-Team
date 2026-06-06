import express from "express";
import crypto from "crypto";
import { scanQueue } from "../queue/scanQueue.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { prisma } from "../../../packages/prisma/index.js";

const router = express.Router();

// ==========================================
// GitHub URL Validator
// ==========================================

const githubRepoRegex = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/;

// ==========================================
// 1. POST: Queue New Scan
// ==========================================

router.post("/new", verifyToken, async (req, res) => {
  try {
    const { repoUrl } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    if (!githubRepoRegex.test(repoUrl)) {
      return res.status(400).json({ error: "Invalid GitHub repository URL" });
    }

    // Generate deterministic job ID to prevent duplicate scans
    const jobId = crypto
      .createHash("sha256")
      .update(`${userId}-${repoUrl}`)
      .digest("hex");

    const existingJob = await scanQueue.getJob(jobId);

    if (existingJob) {
      const state = await existingJob.getState();

      // Block if scan is already in progress
      if (state === "waiting" || state === "active") {
        return res.status(409).json({
          error: "A scan for this repository is already running.",
        });
      }

      // Remove stale completed or failed jobs before re-queuing
      if (state === "completed" || state === "failed") {
        await existingJob.remove();
      }
    }

    const job = await scanQueue.add(
      "github-scan-job",
      { repoUrl, userId },
      { jobId, removeOnComplete: 50, removeOnFail: 20 }
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

// ==========================================
// 2. GET: Dashboard Stats + History
// ==========================================

router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const userScans = await prisma.scan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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

// ==========================================
// 3. GET: Single Scan Report
// ==========================================

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const scan = await prisma.scan.findUnique({ where: { id: req.params.id } });

    if (!scan) {
      return res.status(404).json({ error: "Scan not found" });
    }

    // Ensure the scan belongs to the requesting user
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