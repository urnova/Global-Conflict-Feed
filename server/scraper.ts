import Parser from "rss-parser";
import { storage } from "./storage.js";
import { fetchTwitterFeed } from "./twitter-client.js";

const parser = new Parser();

// Main RSS feeds from traditional news outlets
const MAIN_FEEDS = [
  { url: "http://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World News" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", source: "NYT World" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera" },
  { url: "http://rss.cnn.com/rss/edition_world.rss", source: "CNN World" },
];

// Telegram channels converted to RSS using RSS bridge (Option A - No Auth Required)
// These are public Telegram channels that discuss international news and conflicts
const TELEGRAM_RSS_FEEDS = [
  {
    url: "https://tg-me.vercel.app/api/rss?channel=rt_com",
    source: "Telegram (RT News)",
  },
  {
    url: "https://tg-me.vercel.app/api/rss?channel=bbcnewsukraine",
    source: "Telegram (BBC News Ukraine)",
  },
  {
    url: "https://tg-me.vercel.app/api/rss?channel=alarabiya_news",
    source: "Telegram (Al Arabiya)",
  },
  {
    url: "https://tg-me.vercel.app/api/rss?channel=SkyNewsBreak",
    source: "Telegram (Sky News Breaking)",
  },
];

// Keywords that indicate breaking or conflict-related news
const BREAKING_KEYWORDS = [
  "missile", "strike", "war", "conflict", "attack", "bomb", "explosion", 
  "military", "troops", "invasion", "alert", "breaking", "crisis", "nuclear",
  "hostage", "ceasefire", "sanctions", "deployment", "emergency", "killed",
  "wounded", "injured", "casualties"
];

async function processRSSFeed(
  feed: { url: string; source: string },
  broadcastNews: (news: any) => void
) {
  try {
    const parsedFeed = await parser.parseURL(feed.url);
    
    // Only process the latest 5 items to avoid overloading
    const items = parsedFeed.items.slice(0, 5);
    
    // Get existing news once to check for duplicates
    const existingNews = await storage.getNews();
    
    for (const item of items) {
      if (!item.title || !item.link) continue;
      
      // Skip if already exists
      if (existingNews.some(n => n.url === item.link || n.title === item.title)) {
        continue;
      }
      
      const titleLower = item.title.toLowerCase();
      const contentLower = (item.contentSnippet || item.content || "").toLowerCase();
      
      const isBreaking = BREAKING_KEYWORDS.some(
        kw => titleLower.includes(kw) || contentLower.includes(kw)
      );
      
      const newsItem = await storage.createNewsItem({
        source: feed.source,
        title: item.title,
        content: item.contentSnippet || item.content || "No content available.",
        url: item.link,
        imageUrl: undefined,
        isBreaking: isBreaking,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      });
      
      console.log(`Ingested: [${feed.source}] ${newsItem.title}`);
      broadcastNews(newsItem);
    }
  } catch (err) {
    console.error(`Error fetching feed ${feed.url}:`, err);
  }
}

export async function fetchRSSFeeds(broadcastNews: (news: any) => void) {
  console.log("=== Starting news aggregation cycle ===");
  
  // Fetch main news outlet feeds
  console.log("Fetching main news feeds (BBC, NYT, Al Jazeera, CNN)...");
  for (const feed of MAIN_FEEDS) {
    await processRSSFeed(feed, broadcastNews);
  }
  
  // Fetch Telegram RSS feeds (Option A - No authentication required)
  console.log("Fetching Telegram RSS feeds...");
  for (const feed of TELEGRAM_RSS_FEEDS) {
    await processRSSFeed(feed, broadcastNews);
  }
  
  // Fetch Twitter/X via API v2 (Option B - If token is set)
  console.log("Fetching Twitter API v2 feed...");
  await fetchTwitterFeed(broadcastNews);
  
  console.log("=== News aggregation cycle complete ===");
}
