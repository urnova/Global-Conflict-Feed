import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { fetchRSSFeeds } from "./scraper";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  const broadcastNews = (news: any) => {
    const payload = JSON.stringify({ type: "news", payload: news });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  };

  // Start scraper interval (every 2 minutes)
  setInterval(() => {
    fetchRSSFeeds(broadcastNews);
  }, 2 * 60 * 1000);
  
  // Initial fetch
  setTimeout(() => fetchRSSFeeds(broadcastNews), 5000);

  app.get(api.news.list.path, async (req, res) => {
    const news = await storage.getNews();
    res.json(news);
  });

  app.post(api.news.ingest.path, async (req, res) => {
    try {
      const input = api.news.ingest.input.parse(req.body);
      
      const publishedAt = input.publishedAt 
        ? new Date(input.publishedAt) 
        : new Date();
        
      const itemToInsert = { ...input, publishedAt };
      const newsItem = await storage.createNewsItem(itemToInsert);
      
      // Broadcast to all connected clients
      broadcastNews(newsItem);
      
      res.status(201).json(newsItem);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed database with some initial example data if empty
  storage.getNews().then(async (items) => {
    if (items.length === 0) {
      const seedItems = [
        {
          source: "BBC News",
          title: "Global Summit Reaches Climate Agreement",
          content: "Leaders from 50 nations have agreed to reduce emissions by an additional 10% by 2030, marking a historic step in international climate cooperation.",
          url: "https://example.com/news/1",
          isBreaking: true,
          imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&q=80&w=1000",
        },
        {
          source: "Twitter",
          title: "SpaceX Starship Launch Successful",
          content: "Just witnessed the incredible launch of the new Starship prototype. The booster landed perfectly on the pad! 🚀",
          url: "https://example.com/news/2",
          isBreaking: false,
        },
        {
          source: "Telegram",
          title: "Tech Conference Highlights",
          content: "Several new AI models were unveiled today. The focus was on smaller, more efficient edge-compute models that can run on consumer hardware.",
          url: "https://example.com/news/3",
          isBreaking: false,
        }
      ];
      
      for (const item of seedItems) {
        await storage.createNewsItem(item);
      }
    }
  }).catch(console.error);

  return httpServer;
}
