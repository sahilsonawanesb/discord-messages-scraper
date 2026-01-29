// src/core/authentication/SessionValidator.ts

import { Logger } from "../../utils/logger";
import { SessionManager } from "./SessionManager";

export class SessionValidator {
  private sessionManager: SessionManager;
  private logger: Logger;

  constructor(sessionManager: SessionManager, logger: Logger) {
    this.sessionManager = sessionManager;
    this.logger = logger;
  }

  /**
   * Simple validation - just check if token is valid
   */
  async validateSession(): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    try {
      this.logger.logOperationStart("Session Validation");

      // Load session
      await this.sessionManager.loadOrCreateSession();
      this.logger.info("Session loaded");

      // Validate token with Discord
      const isValid = await this.sessionManager.isSessionValid();

      if (!isValid) {
        return {
          isValid: false,
          reason: "Token is invalid or expired"
        };
      }

      this.logger.logOperationEnd("Session Validation", 0, {
        status: "Valid"
      });

      return {
        isValid: true
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Session validation failed", { error: errorMsg });

      return {
        isValid: false,
        reason: errorMsg
      };
    }
  }

  /**
   * Validate channel access using API
   */
  async validateChannelAccess(
    serverId: string,
    channelId: string
  ): Promise<{
    hasAccess: boolean;
    reason?: string;
  }> {
    try {
      this.logger.logOperationStart("Channel Access Validation", {
        serverId,
        channelId
      });

      const token = this.sessionManager.getToken();

      // Try to fetch messages from channel
      const response = await fetch(
        `https://discord.com/api/v9/channels/${channelId}/messages?limit=1`,
        {
          headers: {
            "Authorization": token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.ok) {
        this.logger.logOperationEnd("Channel Access Validation", 0, {
          status: "Access granted"
        });

        return { hasAccess: true };
      } else if (response.status === 403) {
        return {
          hasAccess: false,
          reason: "No permission to access this channel"
        };
      } else if (response.status === 404) {
        return {
          hasAccess: false,
          reason: "Channel not found"
        };
      } else {
        return {
          hasAccess: false,
          reason: `API returned status ${response.status}`
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error("Channel access validation failed", { error: errorMsg });

      return {
        hasAccess: false,
        reason: errorMsg
      };
    }
  }

  /**
   * Full validation - check both session and channel access
   */
  async fullValidation(
    serverId: string,
    channelId: string
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    this.logger.logOperationStart("Full Validation", {
      serverId,
      channelId
    });

    // Validate session/token
    const sessionValidation = await this.validateSession();
    if (!sessionValidation.isValid) {
      errors.push(`Session validation failed: ${sessionValidation.reason}`);
    }

    // Validate channel access
    const channelValidation = await this.validateChannelAccess(
      serverId,
      channelId
    );
    if (!channelValidation.hasAccess) {
      errors.push(`Channel access validation failed: ${channelValidation.reason}`);
    }

    const isValid = errors.length === 0;

    if (isValid) {
      this.logger.logOperationEnd("Full Validation", 0, {
        status: "All validations passed"
      });
    } else {
      this.logger.logOperationFailure(
        "Full Validation",
        0,
        new Error(errors.join("; "))
      );
    }

    return { isValid, errors };
  }
}