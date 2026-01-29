import * as readline from "readline";
import { Logger } from "../utils/logger";

export class InputHandler {
  private rl: readline.Interface;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Prompt user for input
   */
  async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Get configuration from user input or environment
   */
  async getConfiguration(): Promise<{
    serverId: string;
    channelId: string;
    token: string;
    timestampStart?: string;
    timestampEnd?: string;
  }> {
    try {
      // Try to read from environment
      let serverId = process.env.DISCORD_SERVER_ID;
      let channelId = process.env.DISCORD_CHANNEL_ID;
      let token = process.env.DISCORD_TOKEN;
      let timestampStart = process.env.DISCORD_TIMESTAMP_START;
      let timestampEnd = process.env.DISCORD_TIMESTAMP_END;

      // If any are missing, prompt user
      if (!serverId || !channelId || !token) {
        console.log("\nDiscord Message Scraper Configuration\n");

        if (!serverId) {
          serverId = await this.prompt("Enter Server ID: ");
        }

        if (!channelId) {
          channelId = await this.prompt("Enter Channel ID: ");
        }

        if (!token) {
          token = await this.prompt("Enter Discord Token: ");
        }

        console.log(
          "\n(Optional) Enter timestamps for filtering (format: YYYY-MM-DD or ISO 8601):\n"
        );

        const startInput = await this.prompt("Start timestamp (optional, press Enter to skip): ");
        if (startInput) {
          timestampStart = startInput;
        }

        const endInput = await this.prompt("End timestamp (optional, press Enter to skip): ");
        if (endInput) {
          timestampEnd = endInput;
        }
      }

      // Validate
      if (!serverId || !channelId || !token) {
        throw new Error("Server ID, Channel ID, and Token are required!");
      }

      console.log("\nConfiguration loaded\n");

      this.logger.info("User configuration", {
        serverId,
        channelId,
        hasTimestampStart: !!timestampStart,
        hasTimestampEnd: !!timestampEnd
      });

      return {
        serverId,
        channelId,
        token,
        timestampStart,
        timestampEnd
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to get configuration", { error: msg });
      throw error;
    }
  }

  /**
   * Close the readline interface
   */
  close(): void {
    this.rl.close();
  }
}