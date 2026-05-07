import type { Page, ElementHandle } from "playwright";
import pino from "pino";

const logger = pino({ name: "extractors" });

export interface RawBusinessData {
  name?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  googleRating?: number;
  reviewCount?: number;
  priceLevel?: string;
  googlePlaceId?: string;
  socialLinks?: Record<string, string>;
  openingHours?: string[];
  claimedOnGoogle?: boolean;
}

export interface NormalizedBusinessData {
  googlePlaceId: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  googleRating: number | null;
  reviewCount: number;
  priceLevel: string | null;
  socialLinks: Record<string, string> | null;
  openingHours: string[] | null;
  claimedOnGoogle: boolean;
}

/**
 * Extract all business data from a Google Maps listing detail panel.
 */
export async function extractBusinessFromListing(
  page: Page,
  listingElement: ElementHandle
): Promise<RawBusinessData> {
  const data: RawBusinessData = {};

  try {
    // Click on the listing to open the detail panel
    await listingElement.click();
    await page.waitForTimeout(2000);

    // Extract name
    data.name = await safeExtractText(
      page,
      'h1[class*="fontHeadlineLarge"], h1[class*="header-title"], div[role="main"] h1'
    );

    // Extract category
    data.category = await safeExtractText(
      page,
      'button[jsaction*="category"], span[jsan*="category"], div[class*="fontBodyMedium"] button:first-of-type'
    );

    // Extract address
    data.address = await safeExtractAttribute(
      page,
      'button[data-item-id="address"], button[aria-label*="Address"]',
      "aria-label"
    );
    if (data.address) {
      data.address = data.address.replace(/^Address:\s*/i, "");
    }

    // Extract rating
    const ratingText = await safeExtractText(
      page,
      'div[class*="fontDisplayLarge"], span[aria-hidden="true"][class*="fontDisplayLarge"]'
    );
    if (ratingText) {
      const parsed = parseFloat(ratingText);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
        data.googleRating = parsed;
      }
    }

    // Extract review count
    const reviewText = await safeExtractText(
      page,
      'span[aria-label*="review"], button[aria-label*="review"]'
    );
    if (reviewText) {
      const match = reviewText.match(/([\d,]+)\s*review/i);
      if (match) {
        data.reviewCount = parseInt(match[1].replace(/,/g, ""), 10);
      }
    }

    // Extract phone
    data.phone = await extractPhoneNumber(page);

    // Extract website
    data.website = await extractWebsite(page);

    // Extract Google Maps URL
    data.googleMapsUrl = page.url();

    // Extract coordinates from URL
    const coords = extractCoordinatesFromUrl(page.url());
    if (coords) {
      data.latitude = coords.lat;
      data.longitude = coords.lng;
    }

    // Extract price level
    data.priceLevel = await safeExtractText(
      page,
      'span[aria-label*="Price"], span[class*="price"]'
    );

    // Extract place ID from URL or data attributes
    data.googlePlaceId = extractPlaceIdFromUrl(page.url());

    // Check if claimed
    const claimedElement = await page.$(
      'span:has-text("Claimed"), a[aria-label*="Claim this business"]'
    );
    data.claimedOnGoogle = claimedElement !== null;

    // Extract opening hours
    const hoursButton = await page.$(
      'button[data-item-id*="oh"], button[aria-label*="hours"]'
    );
    if (hoursButton) {
      try {
        await hoursButton.click();
        await page.waitForTimeout(1000);
        const hoursElements = await page.$$('table[class*="hours"] tr');
        if (hoursElements.length > 0) {
          data.openingHours = [];
          for (const row of hoursElements) {
            const text = await row.textContent();
            if (text) data.openingHours.push(text.trim());
          }
        }
      } catch {
        // Hours extraction is non-critical
      }
    }

    logger.debug({ name: data.name }, "Extracted business data from listing");
  } catch (err) {
    logger.error({ err, name: data.name }, "Error extracting business listing");
  }

  return data;
}

/**
 * Parse latitude and longitude from a Google Maps URL.
 */
export function extractCoordinatesFromUrl(
  url: string
): { lat: number; lng: number } | null {
  // Pattern: @lat,lng,zoom
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return {
      lat: parseFloat(atMatch[1]),
      lng: parseFloat(atMatch[2]),
    };
  }

  // Pattern: ll=lat,lng or center=lat,lng
  const paramMatch = url.match(/(?:ll|center)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (paramMatch) {
    return {
      lat: parseFloat(paramMatch[1]),
      lng: parseFloat(paramMatch[2]),
    };
  }

  return null;
}

/**
 * Extract phone number from the business detail panel.
 */
export async function extractPhoneNumber(
  page: Page
): Promise<string | undefined> {
  // Try the phone button data attribute
  const phoneButton = await page.$(
    'button[data-item-id*="phone"], button[aria-label*="Phone"], a[data-item-id*="phone"]'
  );
  if (phoneButton) {
    const label = await phoneButton.getAttribute("aria-label");
    if (label) {
      const cleaned = label.replace(/^Phone:\s*/i, "").trim();
      if (cleaned) return cleaned;
    }
    const text = await phoneButton.textContent();
    if (text) {
      const phoneMatch = text.match(
        /[\+]?[\d\s\-\(\)]{7,}/
      );
      if (phoneMatch) return phoneMatch[0].trim();
    }
  }

  // Fallback: look for tel: links
  const telLink = await page.$('a[href^="tel:"]');
  if (telLink) {
    const href = await telLink.getAttribute("href");
    if (href) return href.replace("tel:", "");
  }

  return undefined;
}

/**
 * Extract website URL from the business detail panel.
 */
export async function extractWebsite(page: Page): Promise<string | undefined> {
  const websiteButton = await page.$(
    'a[data-item-id="authority"], a[aria-label*="Website"], button[data-item-id="authority"]'
  );
  if (websiteButton) {
    const href = await websiteButton.getAttribute("href");
    if (href && href.startsWith("http")) return href;

    const label = await websiteButton.getAttribute("aria-label");
    if (label) {
      const urlMatch = label.match(/https?:\/\/[^\s]+/);
      if (urlMatch) return urlMatch[0];
      // Sometimes the label just contains the domain
      const cleaned = label.replace(/^Website:\s*/i, "").trim();
      if (cleaned && cleaned.includes(".")) {
        return cleaned.startsWith("http") ? cleaned : `https://${cleaned}`;
      }
    }
  }

  return undefined;
}

/**
 * Extract email addresses from website HTML content.
 */
export async function extractEmail(
  page: Page,
  websiteUrl: string
): Promise<string | undefined> {
  try {
    // Look for mailto links
    const mailtoHref = await page.$eval(
      'a[href^="mailto:"]',
      (el) => (el as HTMLAnchorElement).href
    );
    if (mailtoHref) {
      return mailtoHref.replace("mailto:", "").split("?")[0];
    }
  } catch {
    // No mailto link found
  }

  try {
    // Look for email patterns in page text
    const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
    const emailMatch = bodyText.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );
    if (emailMatch) return emailMatch[0];
  } catch {
    // Extraction failed
  }

  return undefined;
}

/**
 * Extract social media links from website HTML.
 */
export async function extractSocialLinks(
  page: Page
): Promise<Record<string, string>> {
  const socialLinks: Record<string, string> = {};

  const links = await page.$$eval("a[href]", (anchors) =>
    anchors.map((a) => (a as HTMLAnchorElement).href)
  );

  const patterns: Record<string, RegExp> = {
    facebook: /facebook\.com\/[a-zA-Z0-9._-]+/i,
    instagram: /instagram\.com\/[a-zA-Z0-9._-]+/i,
    linkedin: /linkedin\.com\/(company|in)\/[a-zA-Z0-9._-]+/i,
    twitter: /(twitter\.com|x\.com)\/[a-zA-Z0-9._-]+/i,
    youtube: /youtube\.com\/(channel|c|@)[a-zA-Z0-9._-]+/i,
    tiktok: /tiktok\.com\/@[a-zA-Z0-9._-]+/i,
  };

  for (const link of links) {
    for (const [platform, pattern] of Object.entries(patterns)) {
      if (!socialLinks[platform] && pattern.test(link)) {
        socialLinks[platform] = link;
      }
    }
  }

  return socialLinks;
}

/**
 * Normalize raw extracted data into a clean structure.
 */
export function normalizeBusinessData(
  raw: RawBusinessData,
  defaultCity: string,
  defaultCountry: string
): NormalizedBusinessData {
  const name = (raw.name ?? "Unknown Business").trim();
  const address = (raw.address ?? "").trim();

  // Generate a deterministic place ID if none was extracted
  const googlePlaceId =
    raw.googlePlaceId ?? generatePlaceId(name, address);

  return {
    googlePlaceId,
    name,
    category: (raw.category ?? "Business").trim(),
    address: address || "Address not available",
    city: (raw.city ?? defaultCity).trim(),
    state: raw.state?.trim() ?? null,
    country: (raw.country ?? defaultCountry).trim(),
    zipCode: raw.zipCode?.trim() ?? null,
    phone: normalizePhone(raw.phone) ?? null,
    email: raw.email?.trim().toLowerCase() ?? null,
    website: normalizeUrl(raw.website) ?? null,
    googleMapsUrl: raw.googleMapsUrl ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    googleRating:
      raw.googleRating != null
        ? Math.round(raw.googleRating * 10) / 10
        : null,
    reviewCount: raw.reviewCount ?? 0,
    priceLevel: raw.priceLevel?.trim() ?? null,
    socialLinks:
      raw.socialLinks && Object.keys(raw.socialLinks).length > 0
        ? raw.socialLinks
        : null,
    openingHours: raw.openingHours ?? null,
    claimedOnGoogle: raw.claimedOnGoogle ?? false,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function extractPlaceIdFromUrl(url: string): string | undefined {
  // Pattern: place_id: or data= in URL
  const placeIdMatch = url.match(/place_id[=:]([A-Za-z0-9_-]+)/);
  if (placeIdMatch) return placeIdMatch[1];

  // Hex-encoded place ID in the !1s portion of the data parameter
  const dataMatch = url.match(/!1s(0x[a-f0-9]+:[a-f0-9]+)/);
  if (dataMatch) return dataMatch[1];

  return undefined;
}

function generatePlaceId(name: string, address: string): string {
  // Simple hash-based ID for businesses without a Google Place ID
  const input = `${name}|${address}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `gen_${Math.abs(hash).toString(36)}`;
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Remove non-numeric characters except + at the start
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.length >= 7 ? cleaned : undefined;
}

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  let normalized = url.trim();
  if (!normalized.startsWith("http")) {
    normalized = `https://${normalized}`;
  }
  try {
    new URL(normalized);
    return normalized;
  } catch {
    return undefined;
  }
}

async function safeExtractText(
  page: Page,
  selector: string
): Promise<string | undefined> {
  try {
    const el = await page.$(selector);
    if (el) {
      const text = await el.textContent();
      return text?.trim() || undefined;
    }
  } catch {
    // Selector not found
  }
  return undefined;
}

async function safeExtractAttribute(
  page: Page,
  selector: string,
  attribute: string
): Promise<string | undefined> {
  try {
    const el = await page.$(selector);
    if (el) {
      const value = await el.getAttribute(attribute);
      return value?.trim() || undefined;
    }
  } catch {
    // Selector not found
  }
  return undefined;
}
