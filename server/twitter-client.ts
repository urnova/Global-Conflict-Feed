import { storage } from "./storage.js";

// Breaking news search queries for Twitter API v2
const SEARCH_QUERIES = [
  "breaking news international",
  "missile attack OR strike",
  "war OR conflict military",
  "explosion emergency alert",
  "ceasefire agreement international"
];

interface TwitterV2Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    like_count: number;
    reply_count: number;
    retweet_count: number;
  };
}

interface TwitterV2Response {
  data: TwitterV2Tweet[];
  meta?: {
    result_count: number;
  };
}

export async function fetchTwitterFeed(
  broadcastNews: (news: any) => void
): Promise<void> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  
  if (!bearerToken) {
    console.warn("TWITTER_BEARER_TOKEN not set - skipping Twitter API feed");
    return;
  }

  console.log("Fetching tweets from Twitter API v2...");

  for (const query of SEARCH_QUERIES) {
    try {
      // Twitter API v2 search endpoint
      const response = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(
          query
        )}&max_results=10&tweet.fields=created_at,public_metrics&expansions=author_id&user.fields=username`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            "User-Agent": "NewsAggregator/1.0",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("Twitter API rate limit reached, skipping");
          return;
        }
        console.error(`Twitter API error: ${response.status}`);
        continue;
      }

      const data: TwitterV2Response = await response.json();

      if (!data.data) continue;

      // Check for duplicates and insert new tweets
      const existingNews = await storage.getNews();

      for (const tweet of data.data) {
        // Create unique URL for tweet
        const tweetUrl = `https://x.com/i/web/status/${tweet.id}`;

        // Skip if already exists
        if (existingNews.some((n) => n.url === tweetUrl)) {
          continue;
        }

        // Detect breaking news by engagement or keywords
        const metrics = tweet.public_metrics || {};
        const isBreaking =
          metrics.retweet_count > 100 ||
          metrics.like_count > 500 ||
          ["missile", "strike", "war", "attack", "breaking"].some((kw) =>
            tweet.text.toLowerCase().includes(kw)
          );

        const newsItem = await storage.createNewsItem({
          source: "X/Twitter",
          title: tweet.text.substring(0, 100),
          content: tweet.text,
          url: tweetUrl,
          isBreaking: isBreaking,
          publishedAt: new Date(tweet.created_at),
        });

        console.log(`Ingested tweet: ${newsItem.title}`);
        broadcastNews(newsItem);
      }
    } catch (err) {
      console.error(`Error fetching Twitter query "${query}":`, err);
    }
  }
}
