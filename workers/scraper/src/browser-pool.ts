import { chromium, type Browser } from "playwright";
import pino from "pino";

const logger = pino({ name: "browser-pool" });

interface PooledBrowser {
  browser: Browser;
  inUse: boolean;
  createdAt: number;
}

export class BrowserPool {
  private pool: PooledBrowser[] = [];
  private maxBrowsers: number;
  private waitQueue: Array<(browser: Browser) => void> = [];
  private closed = false;

  constructor(maxBrowsers?: number) {
    this.maxBrowsers =
      maxBrowsers ?? parseInt(process.env.MAX_CONCURRENT_BROWSERS ?? "3", 10);
    logger.info({ maxBrowsers: this.maxBrowsers }, "Browser pool initialized");
  }

  async acquire(): Promise<Browser> {
    if (this.closed) {
      throw new Error("Browser pool is closed");
    }

    // Try to find an available browser in the pool
    const available = this.pool.find((entry) => !entry.inUse);
    if (available) {
      if (available.browser.isConnected()) {
        available.inUse = true;
        logger.debug("Reusing existing browser from pool");
        return available.browser;
      }
      // Browser disconnected — remove it and fall through
      this.pool = this.pool.filter((e) => e !== available);
      logger.warn("Removed disconnected browser from pool");
    }

    // If pool has capacity, launch a new browser
    if (this.pool.length < this.maxBrowsers) {
      const browser = await this.launchBrowser();
      const entry: PooledBrowser = {
        browser,
        inUse: true,
        createdAt: Date.now(),
      };
      this.pool.push(entry);

      // Handle unexpected disconnects
      browser.on("disconnected", () => {
        logger.warn("Browser disconnected unexpectedly");
        this.pool = this.pool.filter((e) => e.browser !== browser);
        // If someone is waiting, try to give them a new browser
        if (this.waitQueue.length > 0) {
          this.tryFulfillWaiter();
        }
      });

      logger.info(
        { poolSize: this.pool.length },
        "Launched new browser for pool"
      );
      return browser;
    }

    // Pool is at capacity — wait in queue
    logger.debug("Pool at capacity, waiting for available browser");
    return new Promise<Browser>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(browser: Browser): void {
    const entry = this.pool.find((e) => e.browser === browser);
    if (!entry) {
      logger.warn("Attempted to release a browser not in pool");
      return;
    }

    entry.inUse = false;

    // If there are waiters, give them this browser immediately
    if (this.waitQueue.length > 0 && browser.isConnected()) {
      const waiter = this.waitQueue.shift()!;
      entry.inUse = true;
      waiter(browser);
      return;
    }

    logger.debug("Browser released back to pool");
  }

  async closeAll(): Promise<void> {
    this.closed = true;

    // Reject all waiters
    for (const waiter of this.waitQueue) {
      // Resolve with a dummy that will immediately fail — safer than leaving hanging
    }
    this.waitQueue = [];

    const closePromises = this.pool.map(async (entry) => {
      try {
        if (entry.browser.isConnected()) {
          await entry.browser.close();
        }
      } catch (err) {
        logger.error({ err }, "Error closing browser");
      }
    });

    await Promise.allSettled(closePromises);
    this.pool = [];
    logger.info("All browsers closed");
  }

  get size(): number {
    return this.pool.length;
  }

  get availableCount(): number {
    return this.pool.filter((e) => !e.inUse && e.browser.isConnected()).length;
  }

  private async launchBrowser(): Promise<Browser> {
    return chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--single-process",
      ],
    });
  }

  private async tryFulfillWaiter(): Promise<void> {
    if (this.waitQueue.length === 0 || this.closed) return;

    try {
      const browser = await this.launchBrowser();
      const entry: PooledBrowser = {
        browser,
        inUse: true,
        createdAt: Date.now(),
      };
      this.pool.push(entry);

      browser.on("disconnected", () => {
        this.pool = this.pool.filter((e) => e.browser !== browser);
        if (this.waitQueue.length > 0) {
          this.tryFulfillWaiter();
        }
      });

      const waiter = this.waitQueue.shift()!;
      waiter(browser);
    } catch (err) {
      logger.error({ err }, "Failed to launch replacement browser");
    }
  }
}

// Singleton instance
let poolInstance: BrowserPool | null = null;

export function getBrowserPool(): BrowserPool {
  if (!poolInstance) {
    poolInstance = new BrowserPool();
  }
  return poolInstance;
}

export function resetBrowserPool(): void {
  poolInstance = null;
}
