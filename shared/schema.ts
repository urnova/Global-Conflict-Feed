import { pgTable, text, serial, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const newsItems = pgTable("news_items", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 100 }).notNull(), // e.g., 'twitter', 'telegram', 'bbc'
  title: text("title").notNull(),
  content: text("content").notNull(),
  url: text("url"),
  imageUrl: text("image_url"),
  isBreaking: boolean("is_breaking").default(false),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNewsSchema = createInsertSchema(newsItems).omit({ 
  id: true, 
  createdAt: true,
  publishedAt: true 
}).extend({
  publishedAt: z.string().or(z.date()).optional(),
});

export type NewsItem = typeof newsItems.$inferSelect;
export type InsertNewsItem = z.infer<typeof insertNewsSchema>;
