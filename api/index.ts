import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/static";

const app = express();

app.use('/api/chat', express.raw({ type: '*/*', limit: '2mb' }), (req: any, _res: any, next: any) => {
  if (Buffer.isBuffer(req.body)) {
    try { req.body = JSON.parse(req.body.toString('utf8')); } catch { req.body = {}; }
  }
  next();
});

app.use(express.json({
  type: (req: any) => {
    const ct = (req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
    if (ct === 'application/json' || ct === 'text/plain') return true;
    if (req.method === 'POST' && typeof req.url === 'string' && req.url.startsWith('/api')) return true;
    return false;
  },
  verify: (req: any, _res: any, buf: Buffer) => { (req as any).rawBody = buf; },
}));
app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);

let initDone = false;
let initError: unknown = null;

async function ensureReady(): Promise<void> {
  if (initDone) return;
  try {
    await registerRoutes(httpServer, app);
    serveStatic(app);
    app.use((err: any, _req: any, res: any, _next: any) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      if (res.headersSent) return;
      res.status(status).json({ message });
    });
  } catch (err) {
    initError = err;
    console.error('[api] Init error (routes may be degraded):', err);
  }
  initDone = true;
}

// Warm up immediately (don't wait for first request)
ensureReady().catch(() => {});

export default async function handler(req: Request, res: Response) {
  await ensureReady();
  if (initError && !initDone) {
    (res as any).status(503).json({ message: 'Service initializing, please retry' });
    return;
  }
  (app as any)(req, res);
}
