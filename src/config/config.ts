import * as path from "path";
import { ScraperConfig, LogConfig } from "../types";
import { FILE_PATHS, RATE_LIMIT } from "./constants";

/**
 * Application configuration
 */
export class AppConfig {
  /**
   * Get default configuration
   */
  static getDefaultConfig(): {
    logConfig: LogConfig;
    rateLimit: typeof RATE_LIMIT;
  } {
    return {
      logConfig: {
        level: "INFO",
        filePath: path.join(FILE_PATHS.LOGS_DIR, "discord-scraper.log"),
        includeConsole: true,
        includeFile: true,
        includeTimestamp: true
      },
      rateLimit: RATE_LIMIT
    };
  }

  /**
   * Validate scraper configuration
   */
  static validateScraperConfig(config: ScraperConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.serverId) {
      errors.push("serverId is required");
    }

    if (!config.channelId) {
      errors.push("channelId is required");
    }

    if (!config.token) {
      errors.push("token is required");
    }

    if (!config.outputPath) {
      errors.push("outputPath is required");
    }

    if (config.batchSize && (config.batchSize < 1 || config.batchSize > 100)) {
      errors.push("batchSize must be between 1 and 100");
    }

    if (config.rateLimit && (config.rateLimit < 1 || config.rateLimit > 100)) {
      errors.push("rateLimit must be between 1 and 100");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}