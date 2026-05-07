import type { Job } from "bullmq";
import type { Page } from "playwright";
import { prisma } from "@leadforge/database";
import pino from "pino";
import { BrowserPool, getBrowserPool } from "./browser-pool.js";
import {
  extractBusinessFromListing,
  extractEmail,
  extractSocialLinks,
  normalizeBusinessData,
  type NormalizedBusinessData,
} from "./extractors.js";

const logger = pino({ name: "scraper-service" });

const ACTION_DELAY = parseInt(process.env.SCRAPER_ACTION_DELAY ?? "2000", 10);
const MAX_SCROLL_ATTEMPTS = parseInt(
  process.env.MAX_SCROLL_ATTEMPTS ?? "20",
  10
);
const MAX_RETRIES = parseInt(process.env.SCRAPER_MAX_RETRIES ?? "3", 10);
const SEARCH_TIMEOUT = parseInt(process.env.SCRAPER_SEARCH_TIMEOUT ?? "15000", 10);

export interface ScrapingJobData {
  jobId: string;
  query: string;
  city: string;
  country: string;
  radius?: number;
  state?: string;
}

export interface ScrapingResult {
  totalFound: number;
  totalScraped: number;
  totalFailed: number;
  businesses: NormalizedBusinessData[];
}

/**
 * Main scraping function — processes a single scraping job from the queue.
 */
export async function processScrapingJob(
  job: Job<ScrapingJobData>
): Promise<ScrapingResult> {
  const { jobId, query, city, country, state } = job.data;
  logger.info({ jobId, query, city, country }, "Starting scraping job");

  const pool = getBrowserPool();
  const browser = await pool.acquire();
  let page: Page | null = null;

  const result: ScrapingResult = {
    totalFound: 0,
    totalScraped: 0,
    totalFailed: 0,
    businesses: [],
  };

  try {
    // Mark job as running in DB
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to Google Maps
    await page.goto("https://www.google.com/maps", {
      waitUntil: "domcontentloaded",
      timeout: SEARCH_TIMEOUT,
    });
    await delay(ACTION_DELAY);

    // Accept cookies if prompted (common in EU)
    try {
      const acceptButton = await page.$(
        'button[aria-label*="Accept"], button:has-text("Accept all")'
      );
      if (acceptButton) {
        await acceptButton.click();
        await delay(1000);
      }
    } catch {
      // No cookie banner
    }

    // Enter search query
    const searchQuery = `${query} in ${city}, ${country}`;
    logger.info({ searchQuery }, "Searching Google Maps");

    const searchBox = await page.waitForSelector(
      '#searchboxinput, input[aria-label="Search Google Maps"]',
      { timeout: SEARCH_TIMEOUT }
    );
    if (!searchBox) {
      throw new Error("Could not find Google Maps search box");
    }

    await searchBox.fill(searchQuery);
    await delay(500);
    await page.keyboard.press("Enter");
    await delay(3000);

    // Wait for results to load
    await page.waitForSelector(
      'div[role="feed"], div[role="list"], div[class*="result"]',
      { timeout: SEARCH_TIMEOUT }
    );

    // Scroll the results panel to load more businesses
    const listingUrls = await scrollAndCollectListings(page);
    result.totalFound = listingUrls.length;

    logger.info(
      { totalFound: result.totalFound },
      "Found business listings"
    );

    await job.updateProgress(10);

    // Process each listing
    for (let i = 0; i < listingUrls.length; i++) {
      const progressPct = 10 + Math.round((i / listingUrls.length) * 85);

      try {
        const business = await scrapeListingWithRetry(
          page,
          listingUrls[i],
          city,
          country,
          MAX_RETRIES
        );

        if (business) {
          // Save to database
          await saveBusiness(business);
          result.businesses.push(business);
          result.totalScraped++;
        } else {
          result.totalFailed++;
        }
      } catch (err) {
        logger.error(
          { err, index: i, url: listingUrls[i] },
          "Failed to scrape listing"
        );
        result.totalFailed++;
      }

      // Update progress and DB counts periodically
      await job.updateProgress(progressPct);

      if (i % 5 === 0) {
        await prisma.scrapingJob.update({
          where: { id: jobId },
          data: {
            totalFound: result.totalFound,
            totalScraped: result.totalScraped,
            totalFailed: result.totalFailed,
          },
        });
      }

      // Rate limiting delay between listings
      await delay(ACTION_DELAY);
    }

    // Mark job as completed
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        totalFound: result.totalFound,
        totalScraped: result.totalScraped,
        totalFailed: result.totalFailed,
      },
    });

    await job.updateProgress(100);
    logger.info(
      { jobId, totalScraped: result.totalScraped },
      "Scraping job completed"
    );

    return result;
  } catch (err) {
    logger.error({ err, jobId }, "Scraping job failed");

    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : String(err),
        totalFound: result.totalFound,
        totalScraped: result.totalScraped,
        totalFailed: result.totalFailed,
      },
    });

    throw err;
  } finally {
    // Clean up page to free memory
    if (page) {
      try {
        await page.close();
      } catch {
        // Page may already be closed
      }
    }
    pool.release(browser);
  }
}

/**
 * Scroll the Google Maps results panel and collect all listing URLs/elements.
 */
async function scrollAndCollectListings(page: Page): Promise<string[]> {
  const collectedUrls = new Set<string>();
  let scrollAttempts = 0;
  let previousCount = 0;
  let staleCount = 0;

  while (scrollAttempts < MAX_SCROLL_ATTEMPTS) {
    // Collect visible listing links
    const urls = await page.$$eval(
      'a[href*="/maps/place/"]',
      (anchors) =>
        anchors
          .map((a) => (a as HTMLAnchorElement).href)
          .filter((href) => href.includes("/maps/place/"))
    );

    for (const url of urls) {
      collectedUrls.add(url);
    }

    // Check if we found new results
    if (collectedUrls.size === previousCount) {
      staleCount++;
      if (staleCount >= 3) {
        logger.debug("No new results after 3 scroll attempts, stopping");
        break;
      }
    } else {
      staleCount = 0;
    }
    previousCount = collectedUrls.size;

    // Scroll the results panel
    const scrolled = await page.evaluate(() => {
      const feed =
        document.querySelector('div[role="feed"]') ??
        document.querySelector('div[role="list"]');
      if (feed) {
        const prevTop = feed.scrollTop;
        feed.scrollBy(0, 600);
        return feed.scrollTop !== prevTop;
      }
      return false;
    });

    if (!scrolled && staleCount >= 1) {
      break;
    }

    scrollAttempts++;
    await delay(1500);

    // Check for "end of results" indicator
    const endReached = await page.$(
      'span:has-text("end of results"), p:has-text("end of results"), span:has-text("No more results")'
    );
    if (endReached) {
      logger.debug("Reached end of results");
      break;
    }
  }

  logger.info(
    { count: collectedUrls.size, scrollAttempts },
    "Finished collecting listing URLs"
  );

  return Array.from(collectedUrls);
}

/**
 * Scrape a single business listing with retry logic.
 */
async function scrapeListingWithRetry(
  page: Page,
  listingUrl: string,
  defaultCity: string,
  defaultCountry: string,
  maxRetries: number
): Promise<NormalizedBusinessData | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await scrapeSingleListing(
        page,
        listingUrl,
        defaultCity,
        defaultCountry
      );
    } catch (err) {
      logger.warn(
        { err, attempt, maxRetries, listingUrl },
        "Listing scrape attempt failed"
      );

      if (attempt < maxRetries) {
        await delay(ACTION_DELAY * attempt); // Exponential-ish backoff
      }
    }
  }

  return null;
}

/**
 * Navigate to a single listing and extract all business data.
 */
async function scrapeSingleListing(
  page: Page,
  listingUrl: string,
  defaultCity: string,
  defaultCountry: string
): Promise<NormalizedBusinessData> {
  await page.goto(listingUrl, {
    waitUntil: "domcontentloaded",
    timeout: SEARCH_TIMEOUT,
  });
  await delay(2000);

  // Wait for the main content to load
  await page.waitForSelector(
    'div[role="main"] h1, h1[class*="fontHeadlineLarge"]',
    { timeout: 10000 }
  );

  // Use the listing element (the whole page is the detail view now)
  const mainElement = await page.$('div[role="main"]');
  if (!mainElement) {
    throw new Error("Could not find main content element");
  }

  const rawData = await extractBusinessFromListing(page, mainElement);

  // If business has a website, try to extract email and social links
  if (rawData.website) {
    try {
      const websitePage = await page.context().newPage();
      try {
        await websitePage.goto(rawData.website, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });

        const email = await extractEmail(websitePage, rawData.website);
        if (email) rawData.email = email;

        const socialLinks = await extractSocialLinks(websitePage);
        if (Object.keys(socialLinks).length > 0) {
          rawData.socialLinks = socialLinks;
        }
      } finally {
        await websitePage.close();
      }
    } catch (err) {
      logger.debug(
        { err, website: rawData.website },
        "Could not extract data from website"
      );
    }
  }

  return normalizeBusinessData(rawData, defaultCity, defaultCountry);
}

/**
 * Save or update a business record in the database.
 */
async function saveBusiness(data: NormalizedBusinessData): Promise<void> {
  try {
    await prisma.business.upsert({
      where: { googlePlaceId: data.googlePlaceId },
      create: {
        googlePlaceId: data.googlePlaceId,
        name: data.name,
        category: data.category,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email,
        website: data.website,
        googleMapsUrl: data.googleMapsUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        googleRating: data.googleRating,
        reviewCount: data.reviewCount,
        priceLevel: data.priceLevel,
        socialLinks: data.socialLinks ?? undefined,
        openingHours: data.openingHours ?? undefined,
        claimedOnGoogle: data.claimedOnGoogle,
      },
      update: {
        name: data.name,
        category: data.category,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        phone: data.phone,
        email: data.email,
        website: data.website,
        googleMapsUrl: data.googleMapsUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        googleRating: data.googleRating,
        reviewCount: data.reviewCount,
        priceLevel: data.priceLevel,
        socialLinks: data.socialLinks ?? undefined,
        openingHours: data.openingHours ?? undefined,
        claimedOnGoogle: data.claimedOnGoogle,
      },
    });

    logger.debug({ name: data.name }, "Business saved to database");
  } catch (err) {
    logger.error({ err, name: data.name }, "Failed to save business to database");
    throw err;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
