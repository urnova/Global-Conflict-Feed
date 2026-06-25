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

let ready: Promise<void> | null = null;

function ensureReady(): Promise<void> {
  if (!ready) {
    ready = registerRoutes(httpServer, app).then(() => {
      serveStatic(app);
      app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        if (res.headersSent) return next(err);
        res.status(status).json({ message });
      });
    });
  }
  return ready;
}

export default async function handler(req: Request, res: Response) {
  await ensureReady();
  app(req, res);
}
