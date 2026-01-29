import { ValidationResult } from "../types";

export class InputValidator {
  /**
   * Validate Discord Server ID
   */
  static validateServerId(serverId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!serverId || serverId.trim() === "") {
      errors.push("Server ID is required");
    } else if (!/^\d+$/.test(serverId)) {
      errors.push("Server ID must contain only digits");
    } else if (serverId.length > 20) {
      errors.push("Server ID is too long");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate Discord Channel ID
   */
  static validateChannelId(channelId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!channelId || channelId.trim() === "") {
      errors.push("Channel ID is required");
    } else if (!/^\d+$/.test(channelId)) {
      errors.push("Channel ID must contain only digits");
    } else if (channelId.length > 20) {
      errors.push("Channel ID is too long");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate Discord Token
   */
  static validateToken(token: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!token || token.trim() === "") {
      errors.push("Token is required");
    } else if (token.length < 50) {
      errors.push("Token appears to be invalid (too short)");
    } else if (token.includes(" ")) {
      errors.push("Token should not contain spaces");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate timestamp format
   */
  static validateTimestamp(timestamp: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!timestamp) {
      return { isValid: true, errors, warnings };
    }

    // Check if valid ISO 8601 or simple date format
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!isoRegex.test(timestamp) && !dateRegex.test(timestamp)) {
      errors.push(
        "Invalid timestamp format. Use ISO 8601 (2026-01-28T10:00:00Z) or date (2026-01-28)"
      );
    }

    // Try to parse as date
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      errors.push("Timestamp is not a valid date");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate all configuration
   */
  static validateAllConfig(
    serverId: string,
    channelId: string,
    token: string,
    timestampStart?: string,
    timestampEnd?: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate individual fields
    const serverValidation = this.validateServerId(serverId);
    const channelValidation = this.validateChannelId(channelId);
    const tokenValidation = this.validateToken(token);

    errors.push(...serverValidation.errors);
    errors.push(...channelValidation.errors);
    errors.push(...tokenValidation.errors);

    if (timestampStart) {
      const startValidation = this.validateTimestamp(timestampStart);
      errors.push(...startValidation.errors);
    }

    if (timestampEnd) {
      const endValidation = this.validateTimestamp(timestampEnd);
      errors.push(...endValidation.errors);
    }

    // Validate timestamp range
    if (timestampStart && timestampEnd) {
      const startDate = new Date(timestampStart);
      const endDate = new Date(timestampEnd);

      if (startDate > endDate) {
        errors.push("Start timestamp cannot be after end timestamp");
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}