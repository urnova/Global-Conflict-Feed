import { z } from 'zod';
import { insertNewsSchema, newsItems } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  news: {
    list: {
      method: 'GET' as const,
      path: '/api/news' as const,
      responses: {
        200: z.array(z.custom<typeof newsItems.$inferSelect>()),
      },
    },
    ingest: {
      method: 'POST' as const,
      path: '/api/news/ingest' as const,
      input: insertNewsSchema,
      responses: {
        201: z.custom<typeof newsItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export const ws = {
  send: {},
  receive: {
    news: z.custom<typeof newsItems.$inferSelect>(),
  },
};
