import "dotenv/config";
import { Worker, type Job } from "bullmq";
import Redis from "ioredis";
import pino from "pino";
import { prisma } from "@leadforge/database";
import { processScrapingJob, type ScrapingJobData } from "./scraper.service.js";
import { getBrowserPool, resetBrowserPool } from "./browser-pool.js";

const logger = pino({ name: "scraper-worker" });

// ── Redis Connection ────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 5000);
    logger.warn({ attempt: times, delay }, "Redis reconnecting");
    return delay;
  },
});

connection.on("connect", () => logger.info("Redis connected"));
connection.on("error", (err) => logger.error({ err }, "Redis error"));

// ── BullMQ Worker ───────────────────────────────────────────────────

const CONCURRENCY = parseInt(process.env.SCRAPER_CONCURRENCY ?? "2", 10);

const worker = new Worker<ScrapingJobData>(
  "scraping",
  async (job: Job<ScrapingJobData>) => {
    logger.info(
      { jobId: job.data.jobId, query: job.data.query, city: job.data.city },
      "Processing scraping job"
    );

    return processScrapingJob(job);
  },
  {
    connection,
    concurrency: CONCURRENCY,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
    stalledInterval: 60000,
    lockDuration: 300000, // 5 minutes lock — scraping can be slow
  }
);

// ── Worker Event Handlers ───────────────────────────────────────────

worker.on("completed", (job, result) => {
  logger.info(
    {
      jobId: job.data.jobId,
      totalScraped: result?.totalScraped,
      totalFailed: result?.totalFailed,
    },
    "Scraping job completed successfully"
  );
});

worker.on("failed", (job, err) => {
  logger.error(
    {
      jobId: job?.data?.jobId,
      error: err.message,
    },
    "Scraping job failed"
  );
});

worker.on("progress", (job, progress) => {
  logger.debug({ jobId: job.data.jobId, progress }, "Scraping job progress");
});

worker.on("stalled", (jobId) => {
  logger.warn({ jobId }, "Scraping job stalled");
});

worker.on("error", (err) => {
  logger.error({ err }, "Worker error");
});

// ── Graceful Shutdown ───────────────────────────────────────────────

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, "Shutting down scraper worker");

  try {
    // Stop accepting new jobs
    await worker.close();
    logger.info("Worker closed");
  } catch (err) {
    logger.error({ err }, "Error closing worker");
  }

  try {
    // Close all browser instances
    const pool = getBrowserPool();
    await pool.closeAll();
    resetBrowserPool();
    logger.info("Browser pool closed");
  } catch (err) {
    logger.error({ err }, "Error closing browser pool");
  }

  try {
    // Disconnect Redis
    await connection.quit();
    logger.info("Redis disconnected");
  } catch (err) {
    logger.error({ err }, "Error disconnecting Redis");
  }

  try {
    // Disconnect Prisma
    await prisma.$disconnect();
    logger.info("Prisma disconnected");
  } catch (err) {
    logger.error({ err }, "Error disconnecting Prisma");
  }

  logger.info("Scraper worker shutdown complete");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── Startup ─────────────────────────────────────────────────────────

logger.info(
  {
    queue: "scraping",
    concurrency: CONCURRENCY,
    redisUrl: REDIS_URL.replace(/\/\/.*@/, "//***@"), // mask credentials
  },
  "Scraper worker started"
);
