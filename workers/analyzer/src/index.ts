import "dotenv/config";
import { Worker, type Job } from "bullmq";
import Redis from "ioredis";
import pino from "pino";
import { prisma } from "@leadforge/database";
import { chromium, type Browser } from "playwright";
import {
  analyzeWebsite,
  type WebsiteAnalysisResult,
} from "../../scraper/src/website-analyzer.js";
import {
  calculateLeadScore,
  getPriority,
  getRecommendations,
  getNeedFlags,
  type BusinessData,
  type WebsiteAnalysisData,
} from "./lead-scorer.js";

const logger = pino({ name: "analyzer-worker" });

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

// ── Browser Instance ────────────────────────────────────────────────

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) {
    return browser;
  }

  browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  browser.on("disconnected", () => {
    logger.warn("Browser disconnected");
    browser = null;
  });

  logger.info("Browser launched for analysis");
  return browser;
}

// ── Job Types ───────────────────────────────────────────────────────

export interface AnalysisJobData {
  businessId: string;
  websiteUrl: string;
}

interface AnalysisResult {
  analysisId: string;
  leadId: string;
  score: number;
  priority: string;
}

// ── BullMQ Worker ───────────────────────────────────────────────────

const CONCURRENCY = parseInt(process.env.ANALYZER_CONCURRENCY ?? "1", 10);

const worker = new Worker<AnalysisJobData>(
  "analysis",
  async (job: Job<AnalysisJobData>): Promise<AnalysisResult> => {
    const { businessId, websiteUrl } = job.data;
    logger.info({ businessId, websiteUrl }, "Processing analysis job");

    // Step 1: Analyze the website
    const activeBrowser = await getBrowser();
    let analysisResult: WebsiteAnalysisResult;

    try {
      analysisResult = await analyzeWebsite(websiteUrl, activeBrowser);
    } catch (err) {
      logger.error({ err, websiteUrl }, "Website analysis failed");
      throw err;
    }

    await job.updateProgress(50);

    // Step 2: Save WebsiteAnalysis to database
    const websiteAnalysis = await prisma.websiteAnalysis.create({
      data: {
        businessId,
        url: analysisResult.url,
        overallScore: analysisResult.overallScore,
        loadTime: analysisResult.loadTime,
        mobileResponsive: analysisResult.mobileResponsive,
        hasSsl: analysisResult.hasSsl,
        hasAnalytics: analysisResult.hasAnalytics,
        hasCta: analysisResult.hasCta,
        hasBookingSystem: analysisResult.hasBookingSystem,
        seoMeta: analysisResult.seoMeta as any,
        technologies: analysisResult.technologies,
        issues: analysisResult.issues,
        analyzedAt: new Date(),
      },
    });

    logger.info(
      { analysisId: websiteAnalysis.id, overallScore: analysisResult.overallScore },
      "Website analysis saved"
    );

    await job.updateProgress(70);

    // Step 3: Calculate lead score
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error(`Business not found: ${businessId}`);
    }

    const businessData: BusinessData = {
      website: business.website,
      googleRating: business.googleRating,
      reviewCount: business.reviewCount,
      socialLinks: business.socialLinks as Record<string, string> | null,
      phone: business.phone,
      email: business.email,
    };

    const websiteData: WebsiteAnalysisData = {
      overallScore: analysisResult.overallScore,
      hasCta: analysisResult.hasCta,
      hasBookingSystem: analysisResult.hasBookingSystem,
      mobileResponsive: analysisResult.mobileResponsive,
      hasSsl: analysisResult.hasSsl,
      hasAnalytics: analysisResult.hasAnalytics,
      technologies: analysisResult.technologies,
      issues: analysisResult.issues,
    };

    const scoreBreakdown = calculateLeadScore(businessData, websiteData);
    const priority = getPriority(scoreBreakdown.total);
    const recommendations = getRecommendations(businessData, websiteData);
    const needFlags = getNeedFlags(businessData, websiteData);

    await job.updateProgress(85);

    // Step 4: Upsert Lead record
    const existingLead = await prisma.lead.findFirst({
      where: { businessId },
    });

    const leadData = {
      score: scoreBreakdown.total,
      priority,
      hasWebsite: !!business.website,
      websiteScore: analysisResult.overallScore,
      aiRecommendations: recommendations as any,
      ...needFlags,
    };

    let lead;
    if (existingLead) {
      lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: leadData,
      });
    } else {
      lead = await prisma.lead.create({
        data: {
          businessId,
          ...leadData,
        },
      });
    }

    logger.info(
      {
        leadId: lead.id,
        score: scoreBreakdown.total,
        priority,
        recommendations: recommendations.length,
      },
      "Lead score calculated and saved"
    );

    await job.updateProgress(100);

    return {
      analysisId: websiteAnalysis.id,
      leadId: lead.id,
      score: scoreBreakdown.total,
      priority,
    };
  },
  {
    connection,
    concurrency: CONCURRENCY,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
    stalledInterval: 60000,
    lockDuration: 120000,
  }
);

// ── Worker Event Handlers ───────────────────────────────────────────

worker.on("completed", (job, result) => {
  logger.info(
    {
      businessId: job.data.businessId,
      score: result?.score,
      priority: result?.priority,
    },
    "Analysis job completed successfully"
  );
});

worker.on("failed", (job, err) => {
  logger.error(
    {
      businessId: job?.data?.businessId,
      error: err.message,
    },
    "Analysis job failed"
  );
});

worker.on("progress", (job, progress) => {
  logger.debug(
    { businessId: job.data.businessId, progress },
    "Analysis job progress"
  );
});

worker.on("stalled", (jobId) => {
  logger.warn({ jobId }, "Analysis job stalled");
});

worker.on("error", (err) => {
  logger.error({ err }, "Worker error");
});

// ── Graceful Shutdown ───────────────────────────────────────────────

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, "Shutting down analyzer worker");

  try {
    await worker.close();
    logger.info("Worker closed");
  } catch (err) {
    logger.error({ err }, "Error closing worker");
  }

  try {
    if (browser && browser.isConnected()) {
      await browser.close();
      logger.info("Browser closed");
    }
  } catch (err) {
    logger.error({ err }, "Error closing browser");
  }

  try {
    await connection.quit();
    logger.info("Redis disconnected");
  } catch (err) {
    logger.error({ err }, "Error disconnecting Redis");
  }

  try {
    await prisma.$disconnect();
    logger.info("Prisma disconnected");
  } catch (err) {
    logger.error({ err }, "Error disconnecting Prisma");
  }

  logger.info("Analyzer worker shutdown complete");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── Startup ─────────────────────────────────────────────────────────

logger.info(
  {
    queue: "analysis",
    concurrency: CONCURRENCY,
    redisUrl: REDIS_URL.replace(/\/\/.*@/, "//***@"),
  },
  "Analyzer worker started"
);
