import type { Browser, Page } from "playwright";
import pino from "pino";

const logger = pino({ name: "website-analyzer" });

export interface WebsiteAnalysisResult {
  url: string;
  overallScore: number;
  loadTime: number | null;
  mobileResponsive: boolean;
  hasSsl: boolean;
  hasAnalytics: boolean;
  hasCta: boolean;
  hasBookingSystem: boolean;
  seoMeta: SeoMeta;
  technologies: string[];
  issues: string[];
}

export interface SeoMeta {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonical: string | null;
  hasH1: boolean;
  h1Count: number;
  imagesWithoutAlt: number;
  totalImages: number;
}

const ANALYSIS_TIMEOUT = parseInt(
  process.env.WEBSITE_ANALYSIS_TIMEOUT ?? "30000",
  10
);

/**
 * Perform a full website audit using Playwright.
 */
export async function analyzeWebsite(
  url: string,
  browser: Browser
): Promise<WebsiteAnalysisResult> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  logger.info({ url: normalizedUrl }, "Starting website analysis");

  let page: Page | null = null;

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
    });

    page = await context.newPage();

    // Measure load time
    const startTime = Date.now();
    let loadSucceeded = true;

    try {
      await page.goto(normalizedUrl, {
        waitUntil: "domcontentloaded",
        timeout: ANALYSIS_TIMEOUT,
      });
    } catch (err) {
      logger.warn({ err, url: normalizedUrl }, "Page load failed or timed out");
      loadSucceeded = false;
    }

    const loadTime = loadSucceeded ? Date.now() - startTime : null;

    // Run all checks in parallel where possible
    const [
      hasSsl,
      mobileResponsive,
      hasAnalytics,
      hasCta,
      hasBookingSystem,
      seoMeta,
      technologies,
      issues,
    ] = await Promise.all([
      checkSsl(normalizedUrl),
      checkMobileResponsive(page),
      checkAnalytics(page),
      checkCta(page),
      checkBookingSystem(page),
      extractSeoMeta(page),
      detectTechnologies(page),
      identifyIssues(page, normalizedUrl),
    ]);

    // Calculate overall score
    const overallScore = calculateOverallScore({
      loadTime,
      mobileResponsive,
      hasSsl,
      hasAnalytics,
      hasCta,
      hasBookingSystem,
      seoMeta,
      issueCount: issues.length,
    });

    const result: WebsiteAnalysisResult = {
      url: normalizedUrl,
      overallScore,
      loadTime,
      mobileResponsive,
      hasSsl,
      hasAnalytics,
      hasCta,
      hasBookingSystem,
      seoMeta,
      technologies,
      issues,
    };

    logger.info(
      { url: normalizedUrl, overallScore },
      "Website analysis complete"
    );

    await context.close();
    return result;
  } catch (err) {
    logger.error({ err, url: normalizedUrl }, "Website analysis failed");

    if (page) {
      try {
        await page.context().close();
      } catch {
        // Cleanup failure — already logged the primary error
      }
    }

    // Return a minimal result on failure
    return {
      url: normalizedUrl,
      overallScore: 0,
      loadTime: null,
      mobileResponsive: false,
      hasSsl: normalizedUrl.startsWith("https"),
      hasAnalytics: false,
      hasCta: false,
      hasBookingSystem: false,
      seoMeta: {
        title: null,
        description: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        canonical: null,
        hasH1: false,
        h1Count: 0,
        imagesWithoutAlt: 0,
        totalImages: 0,
      },
      technologies: [],
      issues: ["Website could not be loaded for analysis"],
    };
  }
}

// ── Individual Checks ───────────────────────────────────────────────

function checkSsl(url: string): boolean {
  return url.startsWith("https://");
}

async function checkMobileResponsive(page: Page): Promise<boolean> {
  try {
    return page.evaluate(() => {
      // Check for viewport meta tag
      const viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) return false;

      const content = viewport.getAttribute("content") ?? "";
      if (!content.includes("width=device-width")) return false;

      // Check for media queries in stylesheets
      let hasMediaQueries = false;
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule instanceof CSSMediaRule) {
              const media = rule.conditionText ?? rule.media.mediaText;
              if (
                media.includes("max-width") ||
                media.includes("min-width")
              ) {
                hasMediaQueries = true;
                break;
              }
            }
          }
        } catch {
          // Cross-origin stylesheet — can't read rules
        }
        if (hasMediaQueries) break;
      }

      return hasMediaQueries;
    });
  } catch {
    return false;
  }
}

async function checkAnalytics(page: Page): Promise<boolean> {
  try {
    return page.evaluate(() => {
      const html = document.documentElement.outerHTML.toLowerCase();
      const analyticsPatterns = [
        "google-analytics.com",
        "googletagmanager.com",
        "gtag(",
        "ga(",
        "fbq(",
        "facebook.com/tr",
        "hotjar.com",
        "clarity.ms",
        "segment.com",
        "mixpanel.com",
        "plausible.io",
        "analytics.js",
        "matomo",
        "piwik",
      ];
      return analyticsPatterns.some((p) => html.includes(p));
    });
  } catch {
    return false;
  }
}

async function checkCta(page: Page): Promise<boolean> {
  try {
    return page.evaluate(() => {
      const ctaKeywords = [
        "book now",
        "get started",
        "sign up",
        "contact us",
        "get a quote",
        "free trial",
        "schedule",
        "buy now",
        "order now",
        "shop now",
        "learn more",
        "call now",
        "request",
        "subscribe",
        "download",
        "try free",
        "start free",
        "get in touch",
        "enquire",
        "reserve",
      ];

      const buttons = document.querySelectorAll(
        'button, a[role="button"], [class*="btn"], [class*="cta"], input[type="submit"]'
      );

      for (const btn of Array.from(buttons)) {
        const text = (btn.textContent ?? "").toLowerCase().trim();
        if (ctaKeywords.some((kw) => text.includes(kw))) {
          return true;
        }
      }
      return false;
    });
  } catch {
    return false;
  }
}

async function checkBookingSystem(page: Page): Promise<boolean> {
  try {
    return page.evaluate(() => {
      const html = document.documentElement.outerHTML.toLowerCase();
      const bookingPatterns = [
        "calendly.com",
        "acuityscheduling.com",
        "booksy.com",
        "fresha.com",
        "simplybook.me",
        "square.site",
        "opentable.com",
        "resy.com",
        "yelp.com/biz",
        "mindbodyonline.com",
        "appointy.com",
        "setmore.com",
        "schedulicity.com",
        "vagaro.com",
        "treatwell.com",
        "bookingkit",
        "booking-widget",
        "reservation-widget",
        "book-appointment",
        "booking-form",
        "scheduler",
      ];
      return bookingPatterns.some((p) => html.includes(p));
    });
  } catch {
    return false;
  }
}

async function extractSeoMeta(page: Page): Promise<SeoMeta> {
  try {
    return page.evaluate(() => {
      const getMeta = (nameOrProp: string): string | null => {
        const el =
          document.querySelector(`meta[name="${nameOrProp}"]`) ??
          document.querySelector(`meta[property="${nameOrProp}"]`);
        return el?.getAttribute("content") ?? null;
      };

      const h1Elements = document.querySelectorAll("h1");
      const images = document.querySelectorAll("img");
      let imagesWithoutAlt = 0;
      for (const img of Array.from(images)) {
        const alt = img.getAttribute("alt");
        if (!alt || alt.trim() === "") imagesWithoutAlt++;
      }

      const canonical = document.querySelector('link[rel="canonical"]');

      return {
        title: document.title || null,
        description: getMeta("description"),
        ogTitle: getMeta("og:title"),
        ogDescription: getMeta("og:description"),
        ogImage: getMeta("og:image"),
        canonical: canonical?.getAttribute("href") ?? null,
        hasH1: h1Elements.length > 0,
        h1Count: h1Elements.length,
        imagesWithoutAlt,
        totalImages: images.length,
      };
    });
  } catch {
    return {
      title: null,
      description: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      canonical: null,
      hasH1: false,
      h1Count: 0,
      imagesWithoutAlt: 0,
      totalImages: 0,
    };
  }
}

async function detectTechnologies(page: Page): Promise<string[]> {
  try {
    return page.evaluate(() => {
      const techs: string[] = [];
      const html = document.documentElement.outerHTML;
      const htmlLower = html.toLowerCase();

      // Frameworks / CMS
      const techSignatures: Record<string, string[]> = {
        React: ["__react", "react-root", "_reactRootContainer", "data-reactroot"],
        "Next.js": ["__next", "__NEXT_DATA__", "_next/"],
        Vue: ["__vue", "data-v-", "vue-app"],
        Angular: ["ng-version", "ng-app", "[ng-"],
        WordPress: ["wp-content", "wp-includes", "wordpress"],
        Shopify: ["shopify", "cdn.shopify.com"],
        Wix: ["wix.com", "_wixCIDX", "wix-warmup-data"],
        Squarespace: ["squarespace.com", "squarespace-cdn"],
        Webflow: ["webflow.com", "wf-page"],
        "Google Tag Manager": ["googletagmanager.com"],
        "Google Analytics": ["google-analytics.com", "gtag("],
        "Facebook Pixel": ["fbq(", "facebook.com/tr"],
        Bootstrap: ["bootstrap.min.css", "bootstrap.min.js"],
        Tailwind: ["tailwindcss", "tw-"],
        jQuery: ["jquery.min.js", "jquery.js"],
        Stripe: ["stripe.com/v3", "js.stripe.com"],
        Intercom: ["intercom", "intercomSettings"],
        "Drift Chat": ["drift.com", "driftt"],
        "Zendesk Widget": ["zendesk", "zdassets.com"],
        HubSpot: ["hubspot.com", "hs-scripts.com"],
        Mailchimp: ["mailchimp.com", "mc.us"],
        Cloudflare: ["cloudflare", "cf-ray"],
      };

      for (const [tech, signatures] of Object.entries(techSignatures)) {
        if (signatures.some((sig) => htmlLower.includes(sig.toLowerCase()))) {
          techs.push(tech);
        }
      }

      return techs;
    });
  } catch {
    return [];
  }
}

async function identifyIssues(page: Page, url: string): Promise<string[]> {
  const issues: string[] = [];

  try {
    const pageIssues = await page.evaluate(() => {
      const found: string[] = [];

      // Missing title
      if (!document.title || document.title.trim() === "") {
        found.push("Missing page title");
      } else if (document.title.length < 10) {
        found.push("Page title is too short (< 10 characters)");
      } else if (document.title.length > 70) {
        found.push("Page title is too long (> 70 characters)");
      }

      // Missing meta description
      const desc = document.querySelector('meta[name="description"]');
      if (!desc || !desc.getAttribute("content")?.trim()) {
        found.push("Missing meta description");
      }

      // Missing OG tags
      if (!document.querySelector('meta[property="og:title"]')) {
        found.push("Missing Open Graph title tag");
      }
      if (!document.querySelector('meta[property="og:description"]')) {
        found.push("Missing Open Graph description tag");
      }
      if (!document.querySelector('meta[property="og:image"]')) {
        found.push("Missing Open Graph image tag");
      }

      // No H1
      const h1s = document.querySelectorAll("h1");
      if (h1s.length === 0) {
        found.push("Missing H1 heading");
      } else if (h1s.length > 1) {
        found.push(`Multiple H1 headings found (${h1s.length})`);
      }

      // Images without alt text
      const imgs = document.querySelectorAll("img");
      let noAlt = 0;
      for (const img of Array.from(imgs)) {
        if (!img.getAttribute("alt")?.trim()) noAlt++;
      }
      if (noAlt > 0) {
        found.push(`${noAlt} image(s) missing alt text`);
      }

      // No viewport meta
      if (!document.querySelector('meta[name="viewport"]')) {
        found.push("Missing viewport meta tag (not mobile-optimized)");
      }

      // No canonical
      if (!document.querySelector('link[rel="canonical"]')) {
        found.push("Missing canonical URL");
      }

      // No favicon
      if (
        !document.querySelector(
          'link[rel="icon"], link[rel="shortcut icon"]'
        )
      ) {
        found.push("Missing favicon");
      }

      // No lang attribute
      if (!document.documentElement.getAttribute("lang")) {
        found.push("Missing lang attribute on HTML element");
      }

      return found;
    });

    issues.push(...pageIssues);
  } catch (err) {
    issues.push("Could not fully analyze page for issues");
  }

  // SSL check
  if (!url.startsWith("https://")) {
    issues.push("Website does not use HTTPS");
  }

  return issues;
}

// ── Score Calculation ───────────────────────────────────────────────

interface ScoreInput {
  loadTime: number | null;
  mobileResponsive: boolean;
  hasSsl: boolean;
  hasAnalytics: boolean;
  hasCta: boolean;
  hasBookingSystem: boolean;
  seoMeta: SeoMeta;
  issueCount: number;
}

function calculateOverallScore(input: ScoreInput): number {
  let score = 0;
  const maxScore = 100;

  // SSL (15 points)
  if (input.hasSsl) score += 15;

  // Load time (15 points)
  if (input.loadTime !== null) {
    if (input.loadTime < 2000) score += 15;
    else if (input.loadTime < 4000) score += 10;
    else if (input.loadTime < 7000) score += 5;
  }

  // Mobile responsive (15 points)
  if (input.mobileResponsive) score += 15;

  // SEO meta (20 points)
  let seoScore = 0;
  if (input.seoMeta.title) seoScore += 4;
  if (input.seoMeta.description) seoScore += 4;
  if (input.seoMeta.ogTitle) seoScore += 3;
  if (input.seoMeta.ogDescription) seoScore += 3;
  if (input.seoMeta.ogImage) seoScore += 3;
  if (input.seoMeta.hasH1) seoScore += 3;
  score += seoScore;

  // Analytics (10 points)
  if (input.hasAnalytics) score += 10;

  // CTA (10 points)
  if (input.hasCta) score += 10;

  // Booking system (5 points)
  if (input.hasBookingSystem) score += 5;

  // Issue penalty (up to -10 points)
  const issuePenalty = Math.min(input.issueCount * 2, 10);
  score -= issuePenalty;

  // Image alt text quality (5 points)
  if (input.seoMeta.totalImages > 0) {
    const altRatio =
      (input.seoMeta.totalImages - input.seoMeta.imagesWithoutAlt) /
      input.seoMeta.totalImages;
    score += Math.round(altRatio * 5);
  } else {
    score += 5; // No images is not a problem per se
  }

  return Math.max(0, Math.min(maxScore, score));
}
