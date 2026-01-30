# Discord Messages Scraper

A production-ready **Discord message scraper** that fetches all messages from Discord channels using token-based API authentication. Features unlimited pagination, timestamp filtering, rate limiting, and batch CSV operations.

## Features

- **Token-Based Authentication** - Secure Discord API authentication using user tokens
- **Unlimited Pagination** - Fetches all messages from any channel (tested with 6,000+ messages)
- **Timestamp Filtering** - Filter messages by date range (start and end dates)
- **Rate Limiting** - Automatic handling of Discord API rate limits with exponential backoff
- **Batch Operations** - Efficient batch processing (100 messages per request)
- **Single CSV File** - One CSV file per channel, data appends on each run (no duplicates)
- **Complete Data Storage** - Stores all message data including reactions, attachments, embeds, and mentions as JSON
- **Interactive Prompts** - User-friendly input for server ID, channel ID, and token
- **Production Logging** - Comprehensive logging with timestamps, batch tracking, and duration metrics
- **Type Safe** - Full TypeScript support with strict typing
- **Error Handling** - Robust error handling and validation throughout

## Requirements

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Discord Account**: With access to the channels you want to scrape
- **Discord Token**: User token from Discord Developer Tools

##  Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/discord-messages-scraper.git
cd discord-messages-scraper

# Install dependencies
npm install
```

### 2. Build

```bash
# Build TypeScript to JavaScript
npm run build
```

### 3. Run

```bash
# Run the scraper (interactive mode)
npm run dev

# Or in production mode
npm start
```

### 4. Follow Prompts

```
Discord Message Scraper Configuration

Enter Server ID: 1353332269112360962
Enter Channel ID: 1353332270458470535
Enter Discord Token: MTQ0MTAwNTg3ODE1MjI2OTg3NA.Gm...

(Optional) Enter timestamps for filtering:
Start timestamp (optional, press Enter to skip): 2026-01-01
End timestamp (optional, press Enter to skip): 2026-01-31
```

### 5. View Results

```
SUCCESS!
Server: Omnipair (1353332269112360962)
Channel: 💭・general (1353332270458470535)
Messages Scraped: 6289
Total Rows in CSV: 6290
CSV File Size: 14416.66 KB
CSV Location: data/exports/discord_messages_1353332270458470535.csv
Total Duration: 58.71s
```

## Configuration

### Environment Variables

Create `.env` file for non-interactive mode:

```bash
# .env
DISCORD_SERVER_ID=1353332269112360962
DISCORD_CHANNEL_ID=1353332270458470535
DISCORD_TOKEN=YOUR_TOKEN_HERE
DISCORD_TIMESTAMP_START=2026-01-01
DISCORD_TIMESTAMP_END=2026-01-31
```

Load and run:

```bash
export $(cat .env | xargs)
npm start
```

## Project Structure

```
discord-messages-scraper/
├── src/
│   ├── types/
│   │   └── index.ts                    # TypeScript interfaces and types
│   ├── config/
│   │   ├── constants.ts                # Application constants
│   │   └── config.ts                   # Configuration management
│   ├── core/
│   │   ├── authentication/
│   │   │   ├── SessionManager.ts       # Token management and validation
│   │   │   └── SessionValidator.ts     # Session and channel access validation
│   │   ├── scraper/
│   │   │   └── DiscordScraper.ts       # Core scraping logic with pagination
│   │   └── rate-limiter/
│   │       └── RateLimiter.ts          # Rate limiting with retry logic
│   ├── processor/
│   │   └── CSVProcessor.ts             # CSV file operations (append, batch)
│   ├── utils/
│   │   ├── logger.ts                   # Logging system
│   │   ├── input-handler.ts            # Interactive input prompts
│   │   └── validators.ts               # Input validation
│   └── index.ts                        # Main entry point
├── dist/                               # Compiled JavaScript (generated)
├── data/
│   ├── sessions/
│   │   └── discord-token.json          # Stored token (gitignored)
│   └── exports/
│       └── discord_messages_*.csv      # Output CSV files
├── logs/
│   └── discord-scraper.log            # Application logs
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## CSV Output Format

### Headers
```
server_name,server_id,channel_name,channel_id,data
```

### Example Row
```csv
"Omnipair","1353332269112360962","💭・general","1353332270458470535","{""id"":""123456"",""content"":""Hello"",""author"":{""username"":""user123""},""reactions"":[{""emoji"":""👍"",""count"":5}],""attachments"":[{""filename"":""image.png""}]}"
```

### Data Field (JSON)
The `data` column contains complete message information:

```json
{
  "id": "message_id",
  "content": "Message text",
  "author": {
    "id": "user_id",
    "username": "username",
    "avatar": "avatar_hash"
  },
  "timestamp": "2026-01-29T13:33:52.000Z",
  "edited_timestamp": null,
  "reactions": [
    {
      "emoji": {"name": "👍"},
      "count": 5
    }
  ],
  "attachments": [
    {
      "filename": "image.png",
      "size": 2048,
      "url": "https://..."
    }
  ],
  "embeds": [],
  "pinned": false,
  "mentions": []
}
```

## Getting Your Discord Token

### Steps

1. **Open Discord** in your browser (Discord.com)
2. **Open Developer Tools** (Press `F12` or `Ctrl+Shift+I`)
3. **Go to Console Tab**
4. **Paste this command:**
   ```javascript
   document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage.token
   ```
5. **Copy the token** (it starts with `MTQ...`)

### Security Notes

- **Never commit your token** to Git
- **Never share your token** with anyone
- **Keep `.gitignore` updated** with `discord-token.json` and `.env`
- **Treat token like a password** - it gives full account access
- Token expires when you **log out** of Discord

## Performance

### Speed

- **1,000 messages**: ~6 seconds
- **6,289 messages**: ~58 seconds
- **10,000 messages**: ~95 seconds

Rate: **~100-110 messages per second**

### File Sizes

- **1,000 messages**: ~100 KB
- **6,289 messages**: ~7 MB
- **10,000 messages**: ~11 MB

Average: **~1.7 KB per message**

### Batch Processing

- Messages fetched in **batches of 100**
- CSV writes in **batches of 100**
- Automatic **100ms delay** between requests (rate limiting)

## Development

### Run in Development Mode

```bash
# Watch TypeScript changes and run
npm run dev

# Or with debugging
npm run dev -- --inspect
```

### Build Only

```bash
npm run build
```

### Check TypeScript Errors

```bash
npm run type-check
```

### Clean Build

```bash
npm run clean
npm run build
```

## Logs

Logs are stored in `logs/discord-scraper.log` with format:

```json
[2026-01-29T13:33:52.000Z] INFO [Operation_START] { context: "data" }
[2026-01-29T13:33:52.150Z] INFO [Batch fetched] { batchNumber: 1, batchSize: 100, totalSoFar: 100 }
[2026-01-29T13:33:53.205Z] INFO [Operation_SUCCESS] { durationMs: 1205, status: "complete" }
```

### Log Levels

- `DEBUG`: Detailed debugging information
- `INFO`: General information and progress
- `WARN`: Warning messages (non-critical issues)
- `ERROR`: Error messages (operation failures)

## Deployment

### Local Testing

```bash
npm run build
npm run dev
```

### VM Deployment (Hetzner/AWS/etc)

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/discord-messages-scraper.git
cd discord-messages-scraper

# 2. Create token file
mkdir -p ./data/sessions
echo '{"token":"YOUR_TOKEN"}' > ./data/sessions/discord-token.json

# 3. Install and build
npm install
npm run build

# 4. Run
npm start
```


## 🐛 Troubleshooting

### Issue: "Token is invalid"

**Solution:** Get a fresh token from Discord DevTools

```bash
# Update token file
echo '{"token":"YOUR_NEW_TOKEN"}' > ./data/sessions/discord-token.json

# Re-run
npm start
```

### Issue: "Channel not found"

**Solution:** Verify channel ID

- Right-click channel in Discord
- Copy channel ID
- Ensure it's a text channel (not category)

### Issue: "No permission to access"

**Solution:** User account must have access to channel

- Try accessing channel in Discord app first
- Check channel permissions
- Verify server membership

### Issue: Only fetches 100 messages

**Solution:** Pagination might be interrupted

Check logs for errors, ensure:

```bash
# Clean and rebuild
npm run clean
npm run build

# Run again
npm start
```

### Issue: Process keeps running

**Solution:** Press `Ctrl+C` to stop

##  API Reference

### DiscordScraper.scrapeChannel()

```typescript
async scrapeChannel(
  serverId: string,
  channelId: string,
  maxMessages: number = 0,  // 0 = unlimited
  timestampStart?: string,
  timestampEnd?: string
): Promise<ScraperResult>
```

**Parameters:**
- `serverId`: Discord server/guild ID
- `channelId`: Discord channel ID
- `maxMessages`: Maximum messages to fetch (0 = all)
- `timestampStart`: ISO 8601 or YYYY-MM-DD format (optional)
- `timestampEnd`: ISO 8601 or YYYY-MM-DD format (optional)

**Returns:**
```typescript
{
  serverId: string;
  channelId: string;
  messages: DiscordMessage[];
  totalScraped: number;
  totalAppended: number;
  errors: string[];
  warnings: string[];
  duration: number; // milliseconds
}
```

## Dependencies

- **Node.js 18+**: JavaScript runtime
- **TypeScript 5+**: Type safety
- **ts-node**: TypeScript execution



---
