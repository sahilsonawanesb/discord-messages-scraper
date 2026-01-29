import * as fs from "fs";
import * as path from "path";
import { Logger } from "../utils/logger";
import { DiscordMessage, ServerMetadata, CSVRow } from "../types";
import { CSV_HEADERS, BATCH_INSERT_SIZE } from "../config/constants";

export class CSVProcessor {
  private logger: Logger;
  private csvFilePath: string;

  constructor(logger: Logger) {
    this.logger = logger;
    this.csvFilePath = "";
  }

  
    // Initialize CSV file (create if doesn't exist)
   
  initializeCSV(outputDir: string, channelId: string): string {
    try {
      this.logger.logOperationStart("CSV Initialization", { outputDir, channelId });

      // Ensure directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        this.logger.info("Created output directory", { outputDir });
      }

      // Use fixed file name (no timestamp)
      this.csvFilePath = path.join(outputDir, `discord_messages_${channelId}.csv`);

      // Check if file exists
      const fileExists = fs.existsSync(this.csvFilePath);

      if (!fileExists) {
        // Create with headers
        const headerLine = CSV_HEADERS.join(",");
        fs.writeFileSync(this.csvFilePath, headerLine + "\n", "utf-8");
        this.logger.info("Created new CSV file", {
          path: this.csvFilePath
        });
      } else {
        this.logger.info("CSV file exists, will append data", {
          path: this.csvFilePath,
          size: fs.statSync(this.csvFilePath).size
        });
      }

      this.logger.logOperationEnd("CSV Initialization", 0);
      return this.csvFilePath;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to initialize CSV", { error: errorMsg });
      throw error;
    }
  }

  
    // Append messages to CSV in batches
   
  async appendMessages(
    messages: DiscordMessage[],
    metadata: ServerMetadata
  ): Promise<{ appended: number; errors: string[] }> {
    try {
      this.logger.logOperationStart("CSV Append", {
        messageCount: messages.length
      });

      if (!this.csvFilePath) {
        throw new Error("CSV file not initialized");
      }

      const errors: string[] = [];
      let appendedCount = 0;

      // Process in batches
      for (let i = 0; i < messages.length; i += BATCH_INSERT_SIZE) {
        const batch = messages.slice(
          i,
          Math.min(i + BATCH_INSERT_SIZE, messages.length)
        );

        try {
          const csvRows = this.convertToCsvRows(batch, metadata);
          const csvContent = csvRows.map((row) => this.rowToCSV(row)).join("\n") + "\n";

          // Append to file
          fs.appendFileSync(this.csvFilePath, csvContent, "utf-8");

          appendedCount += batch.length;

          this.logger.info("Batch appended to CSV", {
            batchNumber: Math.floor(i / BATCH_INSERT_SIZE) + 1,
            batchSize: batch.length,
            totalAppended: appendedCount
          });
        } catch (batchError) {
          const batchErrorMsg =
            batchError instanceof Error
              ? batchError.message
              : String(batchError);
          errors.push(`Batch ${Math.floor(i / BATCH_INSERT_SIZE) + 1}: ${batchErrorMsg}`);
          this.logger.error("Failed to append batch", { error: batchErrorMsg });
        }
      }

      const fileSize = fs.statSync(this.csvFilePath).size;

      this.logger.logOperationEnd("CSV Append", 0, {
        appended: appendedCount,
        fileSize,
        errors: errors.length
      });

      return { appended: appendedCount, errors };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to append messages to CSV", { error: errorMsg });
      throw error;
    }
  }

  
//   Convert messages to CSV rows
   
  private convertToCsvRows(
    messages: DiscordMessage[],
    metadata: ServerMetadata
  ): CSVRow[] {
    return messages.map((msg) => ({
      server_name: metadata.serverName,
      server_id: metadata.serverId,
      channel_name: metadata.channelName,
      channel_id: metadata.channelId,
      data: JSON.stringify(msg) // Store complete message as JSON
    }));
  }

  /**
   * Convert row to CSV format
   */
  private rowToCSV(row: CSVRow): string {
    const fields = [
      this.escapeCSVField(row.server_name),
      this.escapeCSVField(row.server_id),
      this.escapeCSVField(row.channel_name),
      this.escapeCSVField(row.channel_id),
      this.escapeCSVField(row.data)
    ];

    return fields.join(",");
  }

  /**
   * Escape CSV field
   */
  private escapeCSVField(value: string): string {
    if (typeof value !== "string") {
      value = String(value);
    }

    // If contains comma, quotes, or newline, wrap in quotes and escape inner quotes
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  /**
   * Get CSV file statistics
   */
  getCSVStats(): {
    filePath: string;
    exists: boolean;
    size: number;
    sizeKB: string;
    rowCount: number;
  } {
    try {
      const exists = fs.existsSync(this.csvFilePath);
      const size = exists ? fs.statSync(this.csvFilePath).size : 0;
      const sizeKB = (size / 1024).toFixed(2);

      let rowCount = 0;
      if (exists) {
        const content = fs.readFileSync(this.csvFilePath, "utf-8");
        rowCount = content.split("\n").filter((line) => line.trim() !== "").length - 1; // -1 for header
      }

      return {
        filePath: this.csvFilePath,
        exists,
        size,
        sizeKB,
        rowCount
      };
    } catch (error) {
      this.logger.error("Failed to get CSV stats", {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        filePath: this.csvFilePath,
        exists: false,
        size: 0,
        sizeKB: "0",
        rowCount: 0
      };
    }
  }
}