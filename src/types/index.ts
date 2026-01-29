/**
 * Discord API Response Types
 */

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

export interface DiscordAttachment {
  id: string;
  filename: string;
  description?: string;
  content_type?: string;
  size: number;
  url: string;
  proxy_url: string;
  height?: number | null;
  width?: number | null;
  ephemeral?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
    proxy_icon_url?: string;
  };
  image?: {
    url: string;
    proxy_url: string;
    height?: number;
    width?: number;
  };
  thumbnail?: {
    url: string;
    proxy_url: string;
    height?: number;
    width?: number;
  };
  video?: {
    url?: string;
    proxy_url?: string;
    height?: number;
    width?: number;
  };
  provider?: {
    name?: string;
    url?: string;
  };
  author?: {
    name?: string;
    url?: string;
    icon_url?: string;
    proxy_icon_url?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

export interface DiscordReaction {
  emoji: {
    id: string | null;
    name: string | null;
  };
  count: number;
  me: boolean;
}

export interface DiscordMessage {
  id: string;
  channel_id: string;
  guild_id?: string;
  author: DiscordUser;
  content: string;
  timestamp: string;
  edited_timestamp: string | null;
  tts: boolean;
  mention_everyone: boolean;
  mentions: DiscordUser[];
  mention_roles: string[];
  mention_channels?: Array<{
    id: string;
    guild_id: string;
    name: string;
    type: number;
  }>;
  attachments: DiscordAttachment[];
  embeds: DiscordEmbed[];
  reactions?: DiscordReaction[];
  nonce?: string;
  pinned: boolean;
  webhook_id?: string;
  type: number;
  activity?: {
    type: number;
    party_id?: string;
  };
  application?: {
    id: string;
    name: string;
    icon: string | null;
  };
  application_id?: string;
  message_reference?: {
    message_id: string;
    channel_id: string;
    guild_id?: string;
  };
  flags?: number;
  stickers?: Array<{
    id: string;
    pack_id: string;
    name: string;
    description: string;
    type: number;
    format_type: number;
  }>;
  referenced_message?: DiscordMessage | null;
  interaction?: {
    id: string;
    type: number;
    name: string;
    user: DiscordUser;
  };
  thread?: {
    id: string;
    name: string;
    type: number;
    owner_id: string;
    created_at: string;
  };
  components?: any[];
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  icon_hash?: string | null;
  splash: string | null;
  discovery_splash: string | null;
  owner?: boolean;
  owner_id: string;
  permissions?: string;
  region?: string;
  afk_channel_id: string | null;
  afk_timeout: number;
  widget_enabled?: boolean;
  widget_channel_id?: string | null;
  verification_level: number;
  default_message_notifications: number;
  explicit_content_filter: number;
  roles: any[];
  emojis: any[];
  features: string[];
  mfa_level: number;
  application_id: string | null;
  system_channel_id: string | null;
  system_channel_flags: number;
  rules_channel_id: string | null;
  joined_at?: string;
  large?: boolean;
  unavailable?: boolean;
  member_count?: number;
  voice_states?: any[];
  members?: any[];
  channels?: any[];
  threads?: any[];
  presences?: any[];
  max_presences?: number | null;
  max_members?: number;
  vanity_url_code: string | null;
  description: string | null;
  banner: string | null;
  premium_tier: number;
  premium_subscription_count?: number;
  preferred_locale: string;
  public_updates_channel_id: string | null;
  max_video_channel_users?: number;
  approximate_member_count?: number;
  approximate_presence_count?: number;
  welcome_screen?: any;
  nsfw_level: number;
  stickers?: any[];
  hub_type?: string | null;
}

export interface DiscordChannel {
  id: string;
  type: number;
  guild_id?: string;
  position?: number;
  permission_overwrites?: any[];
  name?: string;
  topic?: string | null;
  nsfw?: boolean;
  last_message_id?: string | null;
  bitrate?: number;
  user_limit?: number;
  rate_limit_per_user?: number;
  recipients?: DiscordUser[];
  icon?: string | null;
  owner_id?: string;
  application_id?: string;
  managed?: boolean;
  parent_id?: string | null;
  last_pin_timestamp?: string | null;
  rtc_region?: string | null;
  video_quality_mode?: number;
  message_count?: number;
  member_count?: number;
  thread_metadata?: any;
  member?: any;
  default_auto_archive_duration?: number;
  flags?: number;
}

export interface ScraperConfig {
  serverId: string;
  channelId: string;
  token: string;
  outputPath: string;
  sessionFilePath: string;
  batchSize?: number;
  rateLimit?: number;
  timestampStart?: string;
  timestampEnd?: string;
}

export interface ScraperResult {
  serverId: string;
  channelId: string;
  messages: DiscordMessage[];
  totalScraped: number;
  totalAppended: number;
  errors: string[];
  warnings: string[];
  duration: number;
  csvFilePath?: string;
}

export interface CSVRow {
  server_name: string;
  server_id: string;
  channel_name: string;
  channel_id: string;
  data: string; // JSON stringified
}

export interface ServerMetadata {
  serverName: string;
  serverId: string;
  channelName: string;
  channelId: string;
}

export interface LogConfig {
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  filePath: string;
  includeConsole: boolean;
  includeFile: boolean;
  includeTimestamp: boolean;
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  maxRetries: number;
  retryDelay: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PaginationState {
  before?: string;
  after?: string;
  hasMore: boolean;
  totalFetched: number;
  lastMessageId?: string;
}