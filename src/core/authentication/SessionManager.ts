import * as fs from "fs";
import * as path from "path";
import { Logger } from "../../utils/logger";

interface TokenConfig {
  token: string;
  createdAt?: string;
  expiresAt?: string;
}

export class SessionManager {
  private token: string = "";
  private logger: Logger;
  private filePath: string;
  private tokenConfig: TokenConfig | null = null;

  constructor(filePath: string, logger: Logger) {
    this.filePath = filePath;
    this.logger = logger;
  }

  /**
   * Load or save Discord token
   */
  async loadOrCreateSession(token?: string): Promise<{ token: string }> {
    try {
      this.logger.logOperationStart("Session Loading");

      // If token provided, use it
      if (token) {
        this.token = token;
        this.logger.info("Using provided token");
        
        // Save to file for future use
        await this.saveTokenToFile(token);
        
        return { token: this.token };
      }

      // Try to load from file
      if (fs.existsSync(this.filePath)) {
        return await this.loadFromFile();
      }

      throw new Error(
        `Token file not found at ${this.filePath} and no token provided. ` +
        `Please provide a token via parameter or create a token file.`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to load session", { error: errorMsg });
      throw error;
    }
  }

  /**
   * Load token from file
   */
  private async loadFromFile(): Promise<{ token: string }> {
    try {
      this.logger.info("Loading token from file", { filePath: this.filePath });

      const fileContent = fs.readFileSync(this.filePath, "utf-8").trim();

      if (!fileContent) {
        throw new Error("Token file is empty");
      }

      const data = JSON.parse(fileContent) as TokenConfig;

      if (!data.token || typeof data.token !== "string") {
        throw new Error("Token must be a string in token file");
      }

      if (data.token.trim() === "") {
        throw new Error("Token value is empty");
      }

      this.token = data.token;
      this.tokenConfig = data;

      this.logger.info("Token loaded successfully from file", {
        tokenLength: this.token.length,
        preview: this.token.substring(0, 20) + "..."
      });

      return { token: this.token };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to load token from file", { error: errorMsg });
      throw error;
    }
  }

  /**
   * Save token to file
   */
  private async saveTokenToFile(token: string): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tokenConfig: TokenConfig = {
        token,
        createdAt: new Date().toISOString()
      };

      fs.writeFileSync(
        this.filePath,
        JSON.stringify(tokenConfig, null, 2),
        "utf-8"
      );

      this.logger.info("Token saved to file", { filePath: this.filePath });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn("Failed to save token to file", { error: errorMsg });
    }
  }

  /**
   * Validate token with Discord API
   */
  async isSessionValid(): Promise<boolean> {
    try {
      if (!this.token) {
        this.logger.error("No token loaded");
        return false;
      }

      this.logger.info("Validating token with Discord API...");

      const response = await fetch("https://discord.com/api/v9/users/@me", {
        method: "GET",
        headers: {
          "Authorization": this.token,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const user = await response.json();
        this.logger.info("Token is valid", {
          userId: user.id,
          username: user.username
        });
        return true;
      } else if (response.status === 401) {
        this.logger.error("Token is invalid or expired");
        return false;
      } else {
        this.logger.warn("Token validation returned unexpected status", {
          status: response.status
        });
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Error validating token", { error: errorMsg });
      return false;
    }
  }

  //Get token for API requests

  getToken(): string {
    if (!this.token) {
      throw new Error("No token loaded. Call loadSession() first.");
    }
    return this.token;
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      filePath: this.filePath,
      tokenLength: this.token.length,
      tokenPreview: this.token.substring(0, 30) + "...",
      isLoaded: this.token.length > 0,
      createdAt: this.tokenConfig?.createdAt
    };
  }
}