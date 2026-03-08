# Real-Time News Data Integration Guide

## Overview

This application aggregates real-time international news from multiple sources and delivers updates to users via WebSocket. The system uses a multi-source architecture to ensure comprehensive, up-to-date coverage of global events.

---

## Current Architecture

### 1. RSS Feed Scraping (BBC, NYT, Al Jazeera, CNN)

**How it works:**

1. **Feed Sources** - Located in `server/scraper.ts`:
   - BBC World News: `http://feeds.bbci.co.uk/news/world/rss.xml`
   - New York Times World: `https://rss.nytimes.com/services/xml/rss/nyt/World.xml`
   - Al Jazeera: `https://www.aljazeera.com/xml/rss/all.xml`
   - CNN World: `http://rss.cnn.com/rss/edition_world.rss`

2. **Polling Mechanism**:
   - **Initial fetch**: 5 seconds after app startup
   - **Recurring fetch**: Every 2 minutes via `setInterval()`
   - Located in `server/routes.ts` lines 32-38

3. **Processing Pipeline** (`server/scraper.ts`):
   ```typescript
   // For each RSS feed:
   // 1. Parse XML using rss-parser library
   // 2. Extract items: title, link, content, pubDate
   // 3. Check for duplicates (by URL or title)
   // 4. Detect breaking news using keyword matching
   // 5. Insert into PostgreSQL database
   // 6. Broadcast via WebSocket
   ```

4. **Breaking News Detection**:
   - Keywords scanned: "missile", "strike", "war", "conflict", "attack", "bomb", "explosion", "military", "troops", "invasion", "alert", "breaking", "crisis"
   - If detected, sets `isBreaking: true`
   - Frontend shows toast alert: "⚠️ BREAKING INTEL"

5. **Data Storage**:
   ```sql
   Table: news_items
   - id (serial, primary key)
   - source (varchar) - e.g., "BBC World News"
   - title (text) - article headline
   - content (text) - article body/snippet
   - url (text) - link to original article
   - imageUrl (text, nullable) - article image
   - isBreaking (boolean) - breaking news flag
   - publishedAt (timestamp) - original publication time
   - createdAt (timestamp) - when added to our DB
   ```

---

## Real-Time Delivery System

### WebSocket Connection

**Server Setup** (`server/routes.ts`):
```typescript
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
const clients = new Set<WebSocket>();

// On connection: add to clients set
// On disconnect: remove from clients set
```

**Broadcasting**:
```typescript
const broadcastNews = (news: any) => {
  const payload = JSON.stringify({ type: "news", payload: news });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};
```

**Client Connection** (`client/src/hooks/use-news.ts`):
- Constructs WS URL: `ws://domain.com/ws` or `wss://domain.com/ws` (for HTTPS)
- Auto-reconnects after 3 seconds if connection drops
- Listens for `{ type: 'news', payload: NewsItem }`
- Updates React Query cache optimistically
- Shows toast if `isBreaking === true`

**Message Flow**:
```
RSS Feed Update
    ↓
Scraper detects new item
    ↓
Insert into database
    ↓
broadcastNews() called
    ↓
Send JSON via WebSocket to all connected clients
    ↓
Client receives message
    ↓
Update cache, show toast
    ↓
UI animates new card into feed
```

---

## How to Extend: Telegram Integration

### Option A: Telegram Channel Scraping (Free, No Auth)

**Implementation Plan**:

1. **Use Telegram RSS Bridge** (free service):
   - `https://tg-me.vercel.app/api/rss?channel=CHANNEL_USERNAME`
   - Converts any Telegram channel to RSS
   - No API key needed

2. **Code Addition** (`server/scraper.ts`):
   ```typescript
   // Add to FEEDS array:
   const FEEDS = [
     // ... existing feeds ...
     { 
       url: "https://tg-me.vercel.app/api/rss?channel=RT_com",  // RT News channel
       source: "Telegram (RT News)" 
     },
     { 
       url: "https://tg-me.vercel.app/api/rss?channel=DowJones",
       source: "Telegram (Dow Jones)"
     },
     { 
       url: "https://tg-me.vercel.app/api/rss?channel=BBCNews",
       source: "Telegram (BBC News)"
     }
   ];
   ```

3. **How it works**:
   - Telegram RSS bridge crawls the channel at regular intervals
   - Converts messages to RSS items
   - Our scraper fetches via RSS (same as BBC, NYT)
   - Messages appear as `source: "Telegram (...)"`

### Option B: Telegram Bot Webhook (Free, Requires Bot)

**More Direct Approach**:

1. **Create Telegram Bot**:
   - Message @BotFather on Telegram
   - Create new bot (get token)
   - Add to desired channels with forwarding permission

2. **Receive Messages**:
   ```typescript
   // In server/routes.ts, add webhook:
   app.post("/api/telegram-webhook", async (req, res) => {
     const message = req.body.message;
     
     if (!message) return res.json({});
     
     // Check if message mentions conflicts, wars, etc.
     const isBreaking = containsBreakingKeywords(message.text);
     
     const newsItem = await storage.createNewsItem({
       source: "Telegram",
       title: message.text.substring(0, 100),
       content: message.text,
       url: `https://t.me/${message.chat.username}/${message.message_id}`,
       isBreaking,
       publishedAt: new Date(message.date * 1000),
     });
     
     broadcastNews(newsItem);
     res.json({ ok: true });
   });
   ```

3. **Register Webhook with Telegram**:
   - API call: `https://api.telegram.org/botTOKEN/setWebhook?url=YOUR_DOMAIN/api/telegram-webhook`
   - Telegram sends POST requests when new messages arrive
   - Instant delivery (no polling needed)

---

## How to Extend: X (Twitter) Integration

### Option A: X API v2 (Free Tier)

**Requirements**:
- Free Twitter API v2 access (get from `developer.twitter.com`)
- Search for keywords: "missile", "war", "military", etc.
- Rate limit: 300,000 tweets/month (free tier)

**Implementation**:
```typescript
// server/twitter-scraper.ts
import Elysia from "elysia";

const SEARCH_KEYWORDS = [
  "breaking news",
  "international conflict",
  "military",
  "ceasefire"
];

export async function fetchTwitterFeed(broadcastNews: (news: any) => void) {
  for (const keyword of SEARCH_KEYWORDS) {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${keyword}&max_results=10`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    );
    
    const data = await response.json();
    
    for (const tweet of data.data || []) {
      const newsItem = await storage.createNewsItem({
        source: "X (Twitter)",
        title: tweet.text.substring(0, 100),
        content: tweet.text,
        url: `https://x.com/i/web/status/${tweet.id}`,
        isBreaking: true,  // Adjust based on engagement/likes
        publishedAt: new Date(tweet.created_at),
      });
      
      broadcastNews(newsItem);
    }
  }
}
```

### Option B: nitter (Free, No Auth Required)

**What is nitter?**
- Open-source, privacy-focused Twitter frontend
- Free public instances (no API key needed)
- Can scrape via RSS

**Implementation**:
```typescript
// Add to FEEDS:
const FEEDS = [
  // ... existing ...
  { 
    url: "https://nitter.net/search/rss?q=breaking%20international",
    source: "X/nitter (Breaking News)"
  },
  { 
    url: "https://nitter.net/search/rss?q=military%20OR%20war",
    source: "X/nitter (Military)"
  }
];
```

**Advantages**:
- Zero authentication
- No rate limits
- Works immediately
- Same RSS pipeline as other feeds

### Option C: Telegram Bot for X Updates (Free Alternative)

Some Telegram bots automatically forward trending X posts. You could:
1. Find a news aggregation bot on Telegram
2. Add it to a private channel you own
3. Forward those updates to your app via Telegram integration

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                                │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  RSS Feeds   │   Telegram   │  X (nitter) │  Other Sources     │
│ (BBC, NYT)   │  (Channels)  │  (via RSS)   │ (TBD)              │
└──────┬───────┴────┬─────────┴────┬────────┴────────┬───────────┘
       │            │              │                 │
       └────────────┼──────────────┼─────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Polling/Scraper    │
         │ (server/scraper.ts) │
         │                     │
         │ - Fetch feeds       │
         │ - Parse items       │
         │ - Detect breaking   │
         │ - Check duplicates  │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────────┐
         │  PostgreSQL Database    │
         │  (news_items table)     │
         │                         │
         │ - Store all news        │
         │ - Track source          │
         │ - Mark breaking         │
         │ - Timestamp records     │
         └──────────┬──────────────┘
                    │
         ┌──────────▼──────────────┐
         │  WebSocket Server       │
         │  (server/routes.ts)     │
         │                         │
         │ - Broadcast on new item │
         │ - Handle connections    │
         │ - Auto-reconnect logic  │
         └──────────┬──────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
   ┌────▼───────┐      ┌──────▼──────┐
   │   Client   │      │   Client    │
   │ (Browser)  │      │ (Browser)   │
   │            │      │             │
   │ Receives   │      │  Receives   │
   │ updates    │      │  updates    │
   │ in real-   │      │  in real-   │
   │ time       │      │  time       │
   └────────────┘      └─────────────┘
```

---

## Data Refresh Intervals & Latency

| Source | Method | Interval | Latency | Cost |
|--------|--------|----------|---------|------|
| RSS (BBC, NYT) | Polling | 2 min | 2-5 min | Free |
| Telegram (Channel RSS) | Polling | 2 min | 2-10 min | Free |
| Telegram (Bot Webhook) | Push | Instant | <1 sec | Free |
| X (nitter RSS) | Polling | 2 min | 5-15 min | Free |
| X (Twitter API) | Polling | Real-time | <30 sec | Free (tier) |

**Current setup**: RSS feeds (2 min interval)
**Optimal setup**: Telegram Webhook + Twitter API (instant to <1 sec)
**Budget setup**: All RSS + nitter (completely free)

---

## Breaking News Detection

**Current Keywords** (case-insensitive):
```
"missile", "strike", "war", "conflict", "attack", "bomb", "explosion",
"military", "troops", "invasion", "alert", "breaking", "crisis"
```

**How to Add More**:
Edit `server/scraper.ts`, line with `const BREAKING_KEYWORDS`:
```typescript
const BREAKING_KEYWORDS = [
  // Existing...
  "nuclear",      // Add new
  "hostage",
  "ceasefire",
  "sanctions"
];
```

**When detected**: 
- `isBreaking: true` in database
- Frontend shows red alert toast
- Prominent styling in UI

---

## Database Schema

```typescript
// shared/schema.ts
export const newsItems = pgTable("news_items", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 100 }).notNull(), // "BBC", "Telegram", "X", etc.
  title: text("title").notNull(),                        // Headline
  content: text("content").notNull(),                    // Article body
  url: text("url"),                                      // Link to source
  imageUrl: text("image_url"),                           // Article image (optional)
  isBreaking: boolean("is_breaking").default(false),     // Breaking news flag
  publishedAt: timestamp("published_at")                 // Original publish time
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at")                     // When we added it
    .defaultNow()
    .notNull(),
});
```

---

## API Endpoints

### GET /api/news
- **Returns**: Array of all news items, sorted by most recent first
- **Limit**: Last 100 items (configurable in `server/storage.ts`)
- **Used by**: Initial page load, feed refresh

### POST /api/news/ingest
- **Input**: NewsItem object (source, title, content, url, imageUrl, isBreaking, publishedAt)
- **Returns**: Created news item with ID
- **Used by**: Scraper, manual ingestion, webhooks

### WebSocket /ws
- **Message format**: `{ type: "news", payload: NewsItem }`
- **When sent**: Immediately after new item is inserted
- **Auto-reconnect**: Yes (3 second intervals)

---

## Environment Variables Required

```bash
# Database (automatically set by Replit)
DATABASE_URL=postgresql://...

# For Twitter API integration (if adding later)
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAAAA...

# For Telegram Bot Webhook (if adding later)
TELEGRAM_BOT_TOKEN=123456789:ABCdef...
```

---

## Adding a New Data Source

**Step 1: Choose Integration Type**
- RSS Feed → use `rss-parser` library
- Telegram Channel → use nitter RSS bridge
- Telegram Bot → add POST webhook endpoint
- Twitter → use Twitter API or nitter RSS

**Step 2: Add Source to `server/scraper.ts`**
```typescript
const FEEDS = [
  // ... existing ...
  { url: "new-feed-url", source: "New Source Name" }
];
```

**Step 3: Test**
```bash
npm run dev
# Watch logs for "Ingested new item: ..."
```

**Step 4: Deploy**
- No schema changes needed (unless adding new fields)
- Just redeploy server code

---

## Performance & Scalability

**Current Bottlenecks**:
- RSS polling every 2 minutes (limited by feed update frequency)
- Single-threaded scraper (could add concurrency)
- Database stores all items forever (could implement TTL)

**Improvements**:
1. **Reduce polling interval** to 1 minute
2. **Add Telegram webhook** for instant updates
3. **Add Twitter API** for real-time tweets
4. **Implement feed cache** to reduce API calls
5. **Add database indexes** on `source`, `isBreaking`, `createdAt` for faster queries

---

## Troubleshooting

**Problem**: No new news items appearing
- Check: Is RSS feed still valid? (some feeds go down)
- Check: PostgreSQL database running? (`npm run db:push`)
- Check: Scraper interval running? (check logs for "Fetching RSS feeds")

**Problem**: WebSocket not updating clients
- Check: Clients connected? (should see connection count in logs)
- Check: Are items being inserted? (check database directly)
- Check: Firewall blocking WebSocket? (try different port)

**Problem**: Missing articles from certain source
- Check: Feed URL still accessible
- Check: Is content being filtered out by duplicate detection?
- Solution: Add source to priority list, increase polling frequency

---

## Summary

This application uses a **multi-source, real-time aggregation model**:

1. **Polling** (RSS feeds) for scheduled, reliable news
2. **Webhooks** (optional Telegram) for instant messaging
3. **Search APIs** (optional Twitter) for live trending topics
4. **WebSocket** for pushing updates instantly to all connected users

The system is **extensible**: Add new sources without changing the core architecture.

All integration **costs are free** (no API keys required for RSS, nitter, Telegram RSS bridge).

**Next Steps**: 
- Production deployment
- Add Telegram RSS bridge (5 mins)
- Add Twitter API or nitter (10 mins)
- Monitor and tune polling intervals based on user needs
