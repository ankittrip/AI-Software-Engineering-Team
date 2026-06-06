import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

import http from "http";
import { Server } from "socket.io";
import { QueueEvents } from "bullmq";

import authRoutes from "./routes/auth.js";
import scanRoutes from "./routes/scan.js";

import { prisma } from "../../packages/prisma/index.js";

dotenv.config({ path: "../../.env" });

const app = express();
const PORT = process.env.PORT || 8000;

// ==========================================
// HTTP + SOCKET SERVER
// ==========================================

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ==========================================
// MIDDLEWARES
// ==========================================

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());

// ==========================================
// SOCKET.IO
// ==========================================

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Room support for scoped scan updates
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`[Socket.io] Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ==========================================
// BULLMQ EVENTS
// ==========================================

const queueEvents = new QueueEvents("repository-scan-queue", {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),

    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  },
});

queueEvents.on("progress", (event) => {
  console.log(`[BullMQ] Job ${event.jobId} progress:`, event.data);

  io.emit("scan-progress", {
    jobId: event.jobId,
    message: event.data,
  });
});

queueEvents.on("completed", ({ jobId, returnvalue }) => {
  console.log(`[BullMQ] Job ${jobId} completed`);

  io.emit("scan-complete", {
    jobId,
    result: returnvalue,
  });
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
  console.log(`[BullMQ] Job ${jobId} failed: ${failedReason}`);

  io.emit("scan-failed", {
    jobId,
    error: failedReason,
  });
});

// ==========================================
// ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/scans", scanRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "AI Engine API & WebSockets are running.",
  });
});

// ==========================================
// 404 HANDLER
// ==========================================

app.use("*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  res.status(err.status || 500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

// ==========================================
// START SERVER
// ==========================================

server.listen(PORT, () => {
  console.log(`[Server] API & WebSocket server running on port ${PORT}`);
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

process.on("SIGINT", async () => {
  console.log("[Server] Shutting down gracefully...");

  await queueEvents.close();
  io.close();
  await prisma.$disconnect();

  server.close(() => {
    process.exit(0);
  });
});