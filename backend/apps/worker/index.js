import { Worker } from "bullmq";
import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { prisma } from "../../packages/prisma/index.js";

import { fetchRepoContext } from "./src/agents/githubExtractor.js";
import { runArchitectureAgent } from "./src/agents/architectureAgent.js";
import { runSecurityAgent } from "./src/agents/securityAgent.js";
import { runCodeReviewAgent } from "./src/agents/codeReviewAgent.js";
import { runPerformanceAgent } from "./src/agents/performanceAgent.js";
import { runDependencyAgent } from "./src/agents/dependencyAgent.js";
import { runOrchestrator } from "./src/agents/orchestrator.js";
import { redis } from "../../packages/redis/index.js";

import { storeAgentFindings } from "./src/rag/storeAgentFindings.js";
import { getHistoricalSecurityContext } from "./src/rag/getHistoricalSecurityContext.js";
import { compareFindings } from "./src/rag/compareFindings.js";
import { getPreviousScan } from "./src/rag/getPreviousScan.js";
import { compareScans } from "./src/rag/compareScans.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

console.log("[Worker] Autonomous multi-agent worker is standing by...");

const scanWorker = new Worker(
  "repository-scan-queue",
  async (job) => {
    console.log(`[Worker] Processing job ID: ${job.id}`);
    const scanStart = Date.now();
    
    const skipCache = job.data.skipCache || false;

    try {
      await job.updateProgress("Cloning repository and extracting structure...");

      const repoPath = job.data.repoUrl
        .replace("https://github.com/", "")
        .replace(".git", "");
      const [repoOwner, repoName] = repoPath.split("/");

      const cacheKey =
        "scan:v4:" +
        crypto.createHash("sha256").update(job.data.repoUrl).digest("hex");

      const cachedReportString = await redis.get(cacheKey);

      if (cachedReportString && !skipCache) {
        console.log("[Cache] Cache hit — skipping AI analysis");
        await job.updateProgress("Cached report found. Skipping AI analysis...");

        const report = typeof cachedReportString === 'string' ? JSON.parse(cachedReportString) : cachedReportString;

        const savedScan = await prisma.scan.create({
          data: {
            repoUrl: job.data.repoUrl,
            status: "COMPLETED",
            ...(job.data.userId && {
              user: { connect: { id: job.data.userId } },
            }),
            repoOwner: report.repoOwner || null,
            repoName: report.repoName || null,
            defaultBranch: report.defaultBranch || null,
            totalFilesScanned: report.totalFilesScanned || 0,
            overallScore: report.overallScore,
            riskLevel: report.riskLevel,
            summary: report.summary,
            strengths: report.strengths || [],
            weaknesses: report.weaknesses || [],
            recommendations: report.recommendations || [],
            architectureMetrics: report.architectureMetrics || null,
            securityFindings: report.securityFindings || null,
            codeReviewNotes: report.codeReviewNotes || null,
            performanceData: report.performanceData || null,
            dependencyData: report.dependencyData || null,
            techStack: report.techStack || [],
            
            historicalSecurityContext: report.historicalSecurityContext || null,
            historicalArchitectureContext: report.historicalArchitectureContext || null, 
            historicalCodeReviewContext: report.historicalCodeReviewContext || null,
            historicalPerformanceContext: report.historicalPerformanceContext || null,
            
            securityComparison: report.securityComparison || null,
            scanComparison: report.scanComparison || null,
          },
        });
        console.log(`[DB] Cached scan saved: ${savedScan.id}`);
        await job.updateProgress("Scan fully completed!");

        return { status: "cache_hit", report, scanId: savedScan.id };
      }

      if (skipCache) {
        console.log("[Cache] Cache bypassed due to skipCache flag.");
      }

      const repoContext = await fetchRepoContext(job.data.repoUrl);
      repoContext.repoUrl = job.data.repoUrl;

      await job.updateProgress("Analyzing codebase with 5 parallel AI agents...");
      console.log("[Worker] Dispatching 5 agents in parallel...");

      const withTimeout = (promise, ms, agentName) => {
        let timer;
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`${agentName} agent timed out after ${ms / 1000}s`)),
            ms
          );
        });
        return Promise.race([promise, timeoutPromise]).finally(() =>
          clearTimeout(timer)
        );
      };

      const TIMEOUT_MS = 60000;

      const results = await Promise.allSettled([
        withTimeout(runArchitectureAgent(repoContext), TIMEOUT_MS, "Architecture").then(
          (res) => { console.log("[Agent] Architecture done"); return res; }
        ),
        withTimeout(runSecurityAgent(repoContext), TIMEOUT_MS, "Security").then(
          (res) => { console.log("[Agent] Security done"); return res; }
        ),
        withTimeout(runCodeReviewAgent(repoContext), TIMEOUT_MS, "Code Review").then(
          (res) => { console.log("[Agent] Code review done"); return res; }
        ),
        withTimeout(runPerformanceAgent(repoContext), TIMEOUT_MS, "Performance").then(
          (res) => { console.log("[Agent] Performance done"); return res; }
        ),
        withTimeout(runDependencyAgent(repoContext), TIMEOUT_MS, "Dependency").then(
          (res) => { console.log("[Agent] Dependency done"); return res; }
        ),
      ]);

      const agentNames = ["Architecture", "Security", "Code Review", "Performance", "Dependency"];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          console.log(`[Agent] ${agentNames[index]} succeeded`);
        } else {
          console.error(`[Agent] ${agentNames[index]} failed: ${result.reason?.message || result.reason}`);
        }
      });

      const [archData, secData, reviewData, perfData, depData] = results.map(
        (r) => (r.status === "fulfilled" ? r.value : null)
      );

      let historicalSecurityContext = [];
      if (secData?.criticalThreats?.length) {
        historicalSecurityContext = await getHistoricalSecurityContext(secData.criticalThreats);
      }

      const previousScan = await getPreviousScan(job.data.repoUrl);
      let scanComparison = { improved: [], introduced: [], unchanged: [] };

      if (previousScan?.securityFindings?.criticalThreats?.length) {
        scanComparison = compareScans(
          secData?.criticalThreats || [],
          previousScan.securityFindings.criticalThreats || []
        );
      }

      let securityComparison = { recurringFindings: [], newFindings: [], resolvedFindings: [] };

      if (secData?.criticalThreats?.length && historicalSecurityContext.length) {
        securityComparison = compareFindings(
          secData.criticalThreats,
          historicalSecurityContext
        );
      }

      const failedAgents = results
        .map((result, index) => (result.status === "rejected" ? agentNames[index] : null))
        .filter(Boolean);

      await job.updateProgress("Agents finished. Orchestrator is synthesizing final report...");
      
      const historicalArchitectureContext = archData?.historicalContext || archData?.historicalArchitectureContext || [];
      const historicalCodeReviewContext = reviewData?.historicalContext || reviewData?.historicalCodeReviewContext || [];
      const historicalPerformanceContext = perfData?.historicalContext || perfData?.historicalPerformanceContext || [];

      const finalReport = await runOrchestrator({
        architecture: archData || {},
        security: secData || {},
        codeReview: reviewData || {},
        performance: perfData || {},
        dependencies: depData || {},
        
        historicalSecurityContext, 
        
        historicalArchitectureContext, 
        historicalCodeReviewContext,
        historicalPerformanceContext,

        securityComparison,
        scanComparison,
      });

      console.log("================ DIAGNOSTIC CHECK ================");
      console.log("1. RAG Variable Check (Worker Side):");
      console.log("   historicalArchitectureContext (Worker):", historicalArchitectureContext ? "YES data/array" : "NULL/UNDEFINED");
      
      console.log("2. Orchestrator Return Check:");
      console.log("   historicalArchitectureContext (Orchestrator):", finalReport.historicalArchitectureContext ? "YES data/array" : "NULL/UNDEFINED");
      
      console.log("3. Passing to Prisma:");
      console.log("   Value being sent to DB:", finalReport.historicalArchitectureContext || historicalArchitectureContext || null);
      console.log("==================================================");

      const cachePayload = {
        ...finalReport,
        repoOwner,
        repoName,
        defaultBranch: repoContext.defaultBranch,
        totalFilesScanned: repoContext.fileCount || 0,
        architectureMetrics: archData,
        securityFindings: secData,
        codeReviewNotes: reviewData,
        performanceData: perfData,
        dependencyData: depData,
        techStack: archData?.techStack || [],
        historicalSecurityContext,
        securityComparison,
        scanComparison,
      };

      await redis.set(cacheKey, JSON.stringify(cachePayload), { ex: 60 * 60 * 24 * 7 });
      
      const scanDurationMs = Date.now() - scanStart;
      await job.updateProgress("Saving results to database...");

      const savedScan = await prisma.scan.create({
        data: {
          repoUrl: job.data.repoUrl,
          repoOwner,
          repoName,
          defaultBranch: repoContext.defaultBranch,
          status: "COMPLETED",
          totalFilesScanned: repoContext.fileCount || 0,
          scanDurationMs,
          ...(job.data.userId && {
            user: { connect: { id: job.data.userId } },
          }),
          overallScore: finalReport.overallScore,
          riskLevel: finalReport.riskLevel,
          summary: finalReport.summary,
          strengths: finalReport.strengths || [],
          weaknesses: finalReport.weaknesses || [],
          recommendations: finalReport.recommendations || [],
          architectureMetrics: archData,
          securityFindings: secData,
          codeReviewNotes: reviewData,
          performanceData: perfData,
          dependencyData: depData,
          techStack: archData?.techStack || [],
          historicalSecurityContext,
          historicalArchitectureContext,
          historicalCodeReviewContext,
          historicalPerformanceContext,
          securityComparison,
          scanComparison,
        },
      });

      if (secData) {
        await storeAgentFindings({
          repoUrl: job.data.repoUrl,
          scanId: savedScan.id,
          agent: "security",
          severity: "high",
          findings: [
            ...(secData.criticalThreats || []),
            ...(secData.minorWarnings || []),
            ...(secData.securityObservations || []),
          ],
        });
      }

      if (reviewData) {
        await storeAgentFindings({
          repoUrl: job.data.repoUrl,
          scanId: savedScan.id,
          agent: "code-review",
          severity: "medium",
          findings: [
            ...(reviewData.codeSmells || []).map(s => s.finding),
            ...(reviewData.refactoringSuggestions || []).map(s => s.action),
          ],
        });
      }

      if (perfData) {
        await storeAgentFindings({
          repoUrl: job.data.repoUrl,
          scanId: savedScan.id,
          agent: "performance",
          severity: "medium",
          findings: [
            ...(perfData.bottlenecks || []).map(b => typeof b === "string" ? b : b.issue || JSON.stringify(b)),
            ...(perfData.optimizationOpportunities || []).map(o => typeof o === "string" ? o : o.suggestion || JSON.stringify(o)),
          ],
        });
      }

      if (archData) {
        await storeAgentFindings({
          repoUrl: job.data.repoUrl,
          scanId: savedScan.id,
          agent: "architecture",
          severity: "low",
          findings: [
            ...(archData.risks || []).map(r => typeof r === "string" ? r : r.description || JSON.stringify(r)),
            ...(archData.architecturalObservations || []).map(o => typeof o === "string" ? o : o.observation || JSON.stringify(o)),
          ],
        });
      }

      await job.updateProgress("Scan fully completed!");

      return {
        status: failedAgents.length > 0 ? "partial_success" : "success",
        failedAgents,
        report: finalReport,
        scanId: savedScan.id,
      };
    } catch (error) {
      console.error(error);
      await job.updateProgress(`Error: ${error.message}`);

      try {
        await prisma.scan.create({
          data: {
            repoUrl: job.data.repoUrl,
            status: "FAILED",
            errorMessage: error.message,
            ...(job.data.userId && {
              user: { connect: { id: job.data.userId } },
            }),
          },
        });
      } catch (dbError) {
        console.error(`[DB] Failed to save failed scan record: ${dbError.message}`);
      }

      throw error;
    }
  },
  {
    connection,
    lockDuration: 300000,
    maxStalledCount: 2,
    concurrency: 1,
  }
);

scanWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

scanWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});

// scanWorker.on("ready", () => {
//   console.log("[Worker] Ready to process jobs");
// });

scanWorker.on("active", (job) => {
  console.log(`[Worker] Job ${job.id} is now active`);
});

scanWorker.on("error", (err) => {
  console.error(`[Worker] Worker error: ${err.message}`);
});
