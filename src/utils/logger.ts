import * as fs from "fs";
import * as path from "path";
import { LogConfig, LOG_LEVELS } from "../config/constants";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
}

export class Logger {
  private level: number;
  private logFilePath: string;
  private includeConsole: boolean;
  private includeFile: boolean;
  private includeTimestamp: boolean;
  private operationStack: Array<{ name: string; startTime: number }> = [];

  constructor(config?: LogConfig | string) {
    // Support both new config format and legacy string format
    if (typeof config === "string") {
      // Legacy: Logger("name")
      this.level = LOG_LEVELS.INFO;
      this.logFilePath = "./logs/default.log";
      this.includeConsole = true;
      this.includeFile = true;
      this.includeTimestamp = true;
    } else if (config) {
      // New: Logger({ level, filePath, ... })
      this.level = LOG_LEVELS[config.level];
      this.logFilePath = config.filePath;
      this.includeConsole = config.includeConsole;
      this.includeFile = config.includeFile;
      this.includeTimestamp = config.includeTimestamp;
    } else {
      // Default
      this.level = LOG_LEVELS.INFO;
      this.logFilePath = "./logs/default.log";
      this.includeConsole = true;
      this.includeFile = true;
      this.includeTimestamp = true;
    }

    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.level <= LOG_LEVELS.DEBUG) {
      this.log("DEBUG", message, context);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    if (this.level <= LOG_LEVELS.INFO) {
      this.log("INFO", message, context);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    if (this.level <= LOG_LEVELS.WARN) {
      this.log("WARN", message, context);
    }
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>): void {
    if (this.level <= LOG_LEVELS.ERROR) {
      this.log("ERROR", message, context);
    }
  }

  /**
   * Log operation start
   */
  logOperationStart(
    operationName: string,
    context?: Record<string, any>
  ): void {
    this.operationStack.push({
      name: operationName,
      startTime: Date.now()
    });

    this.info(`${operationName}_START`, context);
  }

  /**
   * Log operation end (success)
   */
  logOperationEnd(
    operationName: string,
    duration: number,
    context?: Record<string, any>
  ): void {
    const operation = this.operationStack.find((op) => op.name === operationName);

    if (operation) {
      const actualDuration = Date.now() - operation.startTime;
      this.operationStack = this.operationStack.filter(
        (op) => op.name !== operationName
      );
      this.info(`${operationName}_SUCCESS`, {
        durationMs: actualDuration,
        ...context
      });
    }
  }

  /**
   * Log operation failure
   */
  logOperationFailure(
    operationName: string,
    duration: number,
    error: Error,
    context?: Record<string, any>
  ): void {
    const operation = this.operationStack.find((op) => op.name === operationName);

    if (operation) {
      const actualDuration = Date.now() - operation.startTime;
      this.operationStack = this.operationStack.filter(
        (op) => op.name !== operationName
      );
      this.error(`${operationName}_FAILED`, {
        durationMs: actualDuration,
        errorMessage: error.message,
        ...context
      });
    }
  }

  /**
   * Core logging function
   */
  private log(
    level: string,
    message: string,
    context?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      timestamp: this.includeTimestamp ? new Date().toISOString() : "",
      level,
      message,
      context
    };

    // Log to console
    if (this.includeConsole) {
      this.logToConsole(logEntry);
    }

    // Log to file
    if (this.includeFile) {
      this.logToFile(logEntry);
    }
  }

  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry): void {
    const parts: string[] = [];

    if (entry.timestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    parts.push(`${entry.level}`);
    parts.push(`[${entry.message}]`);

    const logMessage = parts.join(" ");

    switch (entry.level) {
      case "ERROR":
        console.error(logMessage, entry.context);
        break;
      case "WARN":
        console.warn(logMessage, entry.context);
        break;
      case "DEBUG":
        console.debug(logMessage, entry.context);
        break;
      default:
        console.log(logMessage, entry.context);
    }
  }

  /**
   * Log to file
   */
  private logToFile(entry: LogEntry): void {
    try {
      const logLine = JSON.stringify(entry);
      fs.appendFileSync(this.logFilePath, logLine + "\n", "utf-8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }
}