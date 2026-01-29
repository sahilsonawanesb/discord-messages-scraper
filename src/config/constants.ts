/**
 * Application-wide constants
 */

export const DISCORD_API_BASE = "https://discord.com/api/v9";

export const API_ENDPOINTS = {
  USERS_ME: `${DISCORD_API_BASE}/users/@me`,
  GUILD: (guildId: string) => `${DISCORD_API_BASE}/guilds/${guildId}`,
  CHANNEL: (channelId: string) => `${DISCORD_API_BASE}/channels/${channelId}`,
  CHANNEL_MESSAGES: (channelId: string) =>
    `${DISCORD_API_BASE}/channels/${channelId}/messages`
};

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

export const MESSAGE_LIMITS = {
  MIN: 1,
  MAX: 100,
  DEFAULT: 100
};

export const RATE_LIMIT = {
  REQUESTS_PER_SECOND: 10,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000
};

export const FILE_PATHS = {
  LOGS_DIR: "./logs",
  DATA_DIR: "./data",
  SESSIONS_DIR: "./data/sessions",
  EXPORTS_DIR: "./data/exports",
  TOKEN_FILE: "./data/sessions/discord-token.json",
  CSV_FILE_PREFIX: "discord_messages"
};

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

export interface LogConfig {
    level : "DEBUG" | "INFO" | "WARN" | "ERROR";
    filePath : string;
    includeConsole : boolean;
    includeFile : boolean;
    includeTimestamp : boolean;
}

export const TIMESTAMP_FORMAT = "YYYY-MM-DD HH:mm:ss";

export const CSV_HEADERS = [
  "server_name",
  "server_id",
  "channel_name",
  "channel_id",
  "data"
];

export const BATCH_INSERT_SIZE = 100;

export const PAGINATION_DELAY_MS = 100;