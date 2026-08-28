import express, { type Request, type Response } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes.js";
import { serveStatic } from "../server/static.js";

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
  verify: (_req: any, _res: any, buf: Buffer) => { (_req as any).rawBody = buf; },
}));
app.use(express.urlencoded({ extended: false }));

app.get('/api/ping', (_req: any, res: any) => {
  res.json({ ok: true, ts: Date.now(), env: !!process.env.DATABASE_URL });
});

const httpServer = createServer(app);
let initPromise: Promise<void> | null = null;

function ensureReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await registerRoutes(httpServer, app);
        serveStatic(app);
        app.use((err: any, _req: any, res: any, _next: any) => {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          if (res.headersSent) return;
          res.status(status).json({ message });
        });
        console.log('[api] Routes registered OK');
      } catch (err) {
        console.error('[api] Init error:', err);
      }
    })();
  }
  return initPromise;
}

export default async function handler(req: Request, res: Response) {
  if ((req as any).url === '/api/ping' || (req as any).path === '/api/ping') {
    (res as any).json({ ok: true, ts: Date.now() });
    return;
  }
  await ensureReady();
  (app as any)(req, res);
}
