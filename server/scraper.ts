import Parser from "rss-parser";
import { storage } from "./storage";

const parser = new Parser();

const FEEDS = [
  { url: "http://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World News" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", source: "NYT World" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera" },
  { url: "http://rss.cnn.com/rss/edition_world.rss", source: "CNN World" },
];

// Keywords that indicate breaking or conflict-related news
const BREAKING_KEYWORDS = [
  "missile", "strike", "war", "conflict", "attack", "bomb", "explosion", 
  "military", "troops", "invasion", "alert", "breaking", "crisis"
];

export async function fetchRSSFeeds(broadcastNews: (news: any) => void) {
  console.log("Fetching RSS feeds...");
  
  for (const feed of FEEDS) {
    try {
      const parsedFeed = await parser.parseURL(feed.url);
      
      // Only process the latest 5 items to avoid overloading
      const items = parsedFeed.items.slice(0, 5);
      
      for (const item of items) {
        if (!item.title || !item.link) continue;
        
        // Check if we already have this news item (by URL)
        // Let's implement a simple check in storage or just insert and handle duplicates later.
        // For MVP, we'll fetch existing and check
        const existingNews = await storage.getNews();
        if (existingNews.some(n => n.url === item.link || n.title === item.title)) {
          continue; // Skip if already exists
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
          imageUrl: undefined, // RSS parser might extract this, but keeping it simple
          isBreaking: isBreaking,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        });
        
        console.log(`Ingested new item: ${newsItem.title}`);
        broadcastNews(newsItem);
      }
    } catch (err) {
      console.error(`Error fetching feed ${feed.url}:`, err);
    }
  }
}
