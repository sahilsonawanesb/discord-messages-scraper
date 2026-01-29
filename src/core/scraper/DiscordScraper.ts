import { Logger } from "../../utils/logger";
import { SessionManager } from "../authentication/SessionManager";
import { SessionValidator } from "../authentication/SessionValidator";
import { RateLimiter } from "../../core/rate-limiter/RateLimiter";
import {
  DiscordMessage,
  ScraperResult,
  PaginationState,
  ServerMetadata
} from "../../types";
import { MESSAGE_LIMITS, PAGINATION_DELAY_MS } from "../../config/constants";

export class DiscordScraper {
  private sessionManager: SessionManager;
  private sessionValidator: SessionValidator;
  private rateLimiter: RateLimiter;
  private logger: Logger;

  constructor(logger: Logger, sessionManager: SessionManager) {
    this.logger = logger;
    this.sessionManager = sessionManager;
    this.sessionValidator = new SessionValidator(sessionManager, logger);
    this.rateLimiter = new RateLimiter(logger);
  }

  /**
   * Setup authentication
   */
  async setupAuthentication(): Promise<void> {
    try {
      this.logger.logOperationStart("Authentication Setup");

      await this.sessionManager.loadOrCreateSession();

      const isValid = await this.sessionManager.isSessionValid();

      if (!isValid) {
        throw new Error("Token is not valid");
      }

      this.logger.logOperationEnd("Authentication Setup", 0);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Authentication setup failed", { error: errorMsg });
      throw error;
    }
  }

  /**
   * Scrape messages from channel with pagination and timestamp filtering
   */
  async scrapeChannel(
    serverId: string,
    channelId: string,
    // maxMessages: number = 1000,
    maxMessages : number = 0,
    timestampStart?: string,
    timestampEnd?: string
  ): Promise<ScraperResult> {
    const startTime = Date.now();
    const allMessages: DiscordMessage[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.logger.logOperationStart("Discord Scraping", {
        serverId,
        channelId,
        maxMessages : maxMessages === 0 ? "UNLIMITED" : maxMessages,
        hasTimestampStart: !!timestampStart,
        hasTimestampEnd: !!timestampEnd
      });

      // Setup authentication
      await this.setupAuthentication();

      // Validate access
      this.logger.info("Validating channel access...");
      const validation = await this.sessionValidator.fullValidation(
        serverId,
        channelId
      );

      if (!validation.isValid) {
        errors.push(...validation.errors);
        throw new Error("Validation failed: " + validation.errors.join("; "));
      }

      // Parse timestamps
      const startDate = timestampStart ? new Date(timestampStart) : null;
      const endDate = timestampEnd ? new Date(timestampEnd) : null;

      // Fetch messages with pagination
      this.logger.info("Starting message fetch with pagination", {
        mode : maxMessages === 0 ? "UNLIMITED" : `LIMITED to ${maxMessages}`,
        startDate,
        endDate
      });

      const paginationState: PaginationState = {
        hasMore: true,
        totalFetched: 0
      };


      let batchCount = 0;

      // while (paginationState.hasMore && allMessages.length < maxMessages) {
      while(paginationState.hasMore){
        const batch = await this.fetchMessageBatch(
          channelId,
          MESSAGE_LIMITS.MAX,
          paginationState.before
        );

        if (batch.length === 0) {
          paginationState.hasMore = false;
          this.logger.info("No more messages to fetch");
          break;
        }

        // Filter by timestamps
        const filteredBatch = this.filterByTimestamp(
          batch,
          startDate,
          endDate
        );

        allMessages.push(...filteredBatch);
        paginationState.totalFetched += batch.length;

        // Update pagination
        const lastMessage = batch[batch.length - 1];
        paginationState.before = lastMessage.id;
        paginationState.lastMessageId = lastMessage.id;

        this.logger.info("Batch fetched", {
          batchSize: batch.length,
          filteredSize: filteredBatch.length,
          totalSoFar: allMessages.length,
          hasMore: paginationState.hasMore
        });

        // Check if we've reached the limit
        // if (allMessages.length >= maxMessages) {
        if(maxMessages > 0 && allMessages.length >= maxMessages){
          allMessages.splice(maxMessages);
          paginationState.hasMore = false;
          this.logger.info(`Reached maximum messages limit: ${maxMessages}`);
          break;
        }

        // Delay to avoid rate limiting
        if (paginationState.hasMore) {
          await this.delay(PAGINATION_DELAY_MS);
        }
      }

      this.logger.logOperationEnd("Discord Scraping", Date.now() - startTime, {
        totalMessages: allMessages.length,
        totalFetched: paginationState.totalFetched,
        batchCount : batchCount,
        mode : maxMessages === 0 ? "UNLIMITED" : `LIMITED to ${maxMessages}`
      });

      return {
        serverId,
        channelId,
        messages: allMessages,
        totalScraped: allMessages.length,
        totalAppended: 0,
        errors,
        warnings,
        duration: Date.now() - startTime
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);

      this.logger.error("Scraping failed", {
        error: errorMsg,
        duration: Date.now() - startTime
      });

      return {
        serverId,
        channelId,
        messages: allMessages,
        totalScraped: allMessages.length,
        totalAppended: 0,
        errors,
        warnings,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Fetch a batch of messages
   */
  private async fetchMessageBatch(
    channelId: string,
    limit: number = MESSAGE_LIMITS.MAX,
    before?: string
  ): Promise<DiscordMessage[]> {
    try {
      const token = this.sessionManager.getToken();

      // Build URL
      let url = `https://discord.com/api/v9/channels/${channelId}/messages?limit=${limit}`;

      if (before) {
        url += `&before=${before}`;
      }

      this.logger.debug("Fetching message batch", { url });

      // Execute with rate limiting and retry logic
      const response = await this.rateLimiter.executeWithRetry(
        async () => {
          return await fetch(url, {
            method: "GET",
            headers: {
              "Authorization": token,
              "Content-Type": "application/json"
            }
          });
        },
        `Fetch messages from channel ${channelId}`
      );

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const messages: DiscordMessage[] = await response.json();

      this.logger.debug("Message batch received", {
        count: messages.length,
        status: response.status
      });

      return messages;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to fetch message batch", { error: errorMsg });
      throw error;
    }
  }

  /**
   * Filter messages by timestamp range
   */
  private filterByTimestamp(
    messages: DiscordMessage[],
    startDate?: Date | null,
    endDate?: Date | null
  ): DiscordMessage[] {
    if (!startDate && !endDate) {
      return messages;
    }

    return messages.filter((msg) => {
      const msgDate = new Date(msg.timestamp);

      if (startDate && msgDate < startDate) {
        return false;
      }

      if (endDate && msgDate > endDate) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get server info
   */
  async getServerInfo(serverId: string): Promise<any> {
    try {
      const token = this.sessionManager.getToken();

      const response = await fetch(
        `https://discord.com/api/v9/guilds/${serverId}`,
        {
          headers: {
            "Authorization": token,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        this.logger.warn("Failed to fetch server info", {
          status: response.status
        });
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger.error("Error getting server info", {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Get channel info
   */
  async getChannelInfo(channelId: string): Promise<any> {
    try {
      const token = this.sessionManager.getToken();

      const response = await fetch(
        `https://discord.com/api/v9/channels/${channelId}`,
        {
          headers: {
            "Authorization": token,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        this.logger.warn("Failed to fetch channel info", {
          status: response.status
        });
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger.error("Error getting channel info", {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}