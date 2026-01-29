import { Logger } from "../../utils/logger";
import { RATE_LIMIT } from "../../config/constants";

export class RateLimiter {
  private requestTimes: number[] = [];
  private requestsPerSecond: number;
  private maxRetries: number;
  private retryDelay: number;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.requestsPerSecond = RATE_LIMIT.REQUESTS_PER_SECOND;
    this.maxRetries = RATE_LIMIT.MAX_RETRIES;
    this.retryDelay = RATE_LIMIT.RETRY_DELAY_MS;
  }

  /**
   * Wait before making next request
   */
  async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // Remove old timestamps
    this.requestTimes = this.requestTimes.filter((time) => time > oneSecondAgo);

    // If we've hit the limit, wait
    if (this.requestTimes.length >= this.requestsPerSecond) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = oldestRequest + 1000 - now;

      if (waitTime > 0) {
        this.logger.debug(`Rate limiting: waiting ${waitTime}ms`);
        await this.delay(waitTime);
      }
    }

    // Record this request
    this.requestTimes.push(Date.now());
  }

  /**
   * Execute request with retry logic for rate limiting
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.waitForRateLimit();
        return await fn();
      } catch (error) {
        lastError =
          error instanceof Error
            ? error
            : new Error(String(error));

        // Check if it's a rate limit error
        if (lastError.message.includes("429")) {
          if (attempt < this.maxRetries) {
            const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1);
            this.logger.warn(`Rate limited on ${operationName}. Retrying in ${backoffDelay}ms`, {
              attempt,
              backoffDelay
            });
            await this.delay(backoffDelay);
          }
        } else {
          // Not a rate limit error, don't retry
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    requestsInLastSecond: number;
    availableRequests: number;
  } {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const recentRequests = this.requestTimes.filter((time) => time > oneSecondAgo);

    return {
      requestsInLastSecond: recentRequests.length,
      availableRequests: Math.max(0, this.requestsPerSecond - recentRequests.length)
    };
  }
}