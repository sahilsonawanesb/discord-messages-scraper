import * as fs from "fs";
import * as path from "path";
import { Logger } from "./utils/logger";
import { InputHandler } from "./utils/input-handler";
import { InputValidator } from "./utils/validators";
import { SessionManager } from "./core/authentication/SessionManager";
import { DiscordScraper } from "./core/scraper/DiscordScraper";
import { CSVProcessor } from "./processor/CSVProcessor";
import { FILE_PATHS } from "./config/constants";


// Main application entry point
 
async function main() {
  const logger = new Logger({
    level: "INFO",
    filePath: path.join(FILE_PATHS.LOGS_DIR, "discord-scraper.log"),
    includeConsole: true,
    includeFile: true,
    includeTimestamp: true
  });

  const inputHandler = new InputHandler(logger);

  try {
    logger.info("Discord Message Scraper - Starting");
    logger.info("Production-Level Version");
    logger.info("Features: Pagination, Timestamps, Rate Limiting");

    // Get user input
    const userInput = await inputHandler.getConfiguration();

    // Validate input
    logger.info("Validating user input...");
    const validation = InputValidator.validateAllConfig(
      userInput.serverId,
      userInput.channelId,
      userInput.token,
      userInput.timestampStart,
      userInput.timestampEnd
    );

    if (!validation.isValid) {
      console.error("\nValidation failed:");
      validation.errors.forEach((err) => {
        console.error(`   - ${err}`);
      });
      process.exit(1);
    }

    logger.info("Input validation passed");

    // Initialize managers
    logger.info("Initializing managers...");

    // Create temporary session file with provided token
    const sessionDir = FILE_PATHS.SESSIONS_DIR;
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const sessionFilePath = FILE_PATHS.TOKEN_FILE;

    const sessionManager = new SessionManager(sessionFilePath, logger);
    const scraper = new DiscordScraper(logger, sessionManager);
    const csvProcessor = new CSVProcessor(logger);

    // Load or save token
    await sessionManager.loadOrCreateSession(userInput.token);

    // Initialize CSV file
    const csvFilePath = csvProcessor.initializeCSV(
      FILE_PATHS.EXPORTS_DIR,
      userInput.channelId
    );

    logger.info("All managers initialized");

    // Run scraper with timestamps
    logger.info("Starting scraping process...", {
      serverId: userInput.serverId,
      channelId: userInput.channelId,
      timestampStart: userInput.timestampStart,
      timestampEnd: userInput.timestampEnd
    });

    const scrapeResult = await scraper.scrapeChannel(
      userInput.serverId,
      userInput.channelId,
      1000, // max messages
      userInput.timestampStart,
      userInput.timestampEnd
    );

    // Check for errors
    if (scrapeResult.errors.length > 0) {
      logger.error("Scraping completed with errors", {
        errors: scrapeResult.errors
      });

      scrapeResult.errors.forEach((err) => {
        console.error(`   - ${err}`);
      });

      process.exit(1);
    }

    logger.info("Scraping completed successfully", {
      messagesScraped: scrapeResult.totalScraped,
      duration: scrapeResult.duration
    });

    // Get server and channel info
    logger.info("Fetching server and channel information...");
    const serverInfo = await scraper.getServerInfo(userInput.serverId);
    const channelInfo = await scraper.getChannelInfo(userInput.channelId);

    const serverName = serverInfo?.name || "Unknown";
    const channelName = channelInfo?.name || "Unknown";

    logger.info("Server and channel info retrieved", {
      serverName,
      channelName
    });

    // Append to CSV
    logger.info("Appending messages to CSV...");
    const appendResult = await csvProcessor.appendMessages(
      scrapeResult.messages,
      {
        serverName,
        serverId: userInput.serverId,
        channelName,
        channelId: userInput.channelId
      }
    );

    // Get CSV stats
    const csvStats = csvProcessor.getCSVStats();

    logger.info("Scraping and CSV export completed!", {
      messagesScraped: scrapeResult.totalScraped,
      messagesAppended: appendResult.appended,
      csvPath: csvFilePath,
      csvSize: csvStats.sizeKB,
      totalRows: csvStats.rowCount,
      duration: scrapeResult.duration
    });

    // Print summary
    console.log("\n");
    console.log("DISCORD MESSAGE SCRAPER - SUCCESS");
    console.log(`Server: ${serverName} (${userInput.serverId})`);
    console.log(`Channel: ${channelName} (${userInput.channelId})`);
    console.log(`Messages Scraped: ${scrapeResult.totalScraped}`);
    console.log(`Messages Appended: ${appendResult.appended}`);
    console.log(`Total Rows in CSV: ${csvStats.rowCount}`);
    console.log(`CSV File Size: ${csvStats.sizeKB} KB`);
    console.log(`CSV Location: ${csvFilePath}`);
    console.log(`Total Duration: ${(scrapeResult.duration / 1000).toFixed(2)}s`);
    console.log(`Log File: ${logger.getLogFilePath()}`);
    console.log("\n");

    if (appendResult.errors.length > 0) {
      console.log("Some errors occurred during CSV append:");
      appendResult.errors.forEach((err) => {
        console.log(`   - ${err}`);
      });
      console.log("");
    }

    inputHandler.close();
    process.exit(0);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("Fatal error", { error: errorMsg });

    console.error("\n================================================");
    console.error("FATAL ERROR");
    console.error("================================================");
    console.error(errorMsg);
    console.error(`Log file: ${logger.getLogFilePath()}`);
    console.error("================================================\n");

    inputHandler.close();
    process.exit(1);
  }
}

// Run application
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});