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

const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-software-engineering-team.vercel.app",
  "https://ai-software-engineering-team-fuxy.vercel.app",
  "https://ai-software-engineering-team-fuxy-mqsm6sxt7-ankittrips-projects.vercel.app",
];

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`[Socket.io] Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

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
  
  io.to(event.jobId).emit("scan-progress", {
    jobId: event.jobId,
    message: event.data,
  });
});

queueEvents.on("completed", ({ jobId, returnvalue }) => {
  console.log(`[BullMQ] Job ${jobId} completed`);
  
  io.to(jobId).emit("scan-complete", {
    jobId,
    result: returnvalue,
  });
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
  console.log(`[BullMQ] Job ${jobId} failed: ${failedReason}`);
  
  io.to(jobId).emit("scan-failed", {
    jobId,
    error: failedReason,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/scans", scanRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "AI Engine API & WebSockets are running.",
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({
    status: "error",
    message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
});

server.listen(PORT, () => {
  console.log(`[Server] API & WebSocket server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  console.log("[Server] Shutting down gracefully...");
  await queueEvents.close();
  io.close();
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});