import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),

  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,

  maxRetriesPerRequest: null,
});

export const scanQueue = new Queue(
  "repository-scan-queue",
  { connection }
);