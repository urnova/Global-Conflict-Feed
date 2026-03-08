import { db } from "./db";
import { newsItems, type NewsItem, type InsertNewsItem } from "@shared/schema";
import { desc } from "drizzle-orm";

export interface IStorage {
  getNews(): Promise<NewsItem[]>;
  createNewsItem(item: InsertNewsItem): Promise<NewsItem>;
}

export class DatabaseStorage implements IStorage {
  async getNews(): Promise<NewsItem[]> {
    return await db.select().from(newsItems).orderBy(desc(newsItems.createdAt)).limit(100);
  }

  async createNewsItem(item: InsertNewsItem): Promise<NewsItem> {
    const [newItem] = await db.insert(newsItems).values(item).returning();
    return newItem;
  }
}

export const storage = new DatabaseStorage();
