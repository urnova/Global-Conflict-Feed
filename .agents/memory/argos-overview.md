---
name: Argos Intelligence Dashboard
description: Key decisions, constraints, and quirks for the Argos project
---

# Argos Intelligence V7

## Architecture
- Frontend: React 18 + Vite, TypeScript, Tailwind, shadcn/ui, wouter routing
- Backend: Express 5 + TypeScript (tsx), PostgreSQL + Drizzle ORM
- WebSocket: `/ws` endpoint for live alert push
- Port: 5000 (Express serves both API and Vite frontend)
- Globe: react-globe.gl (Three.js/WebGL) — needs error boundary

## Key Dependencies (must be installed)
- `adm-zip` + `@types/adm-zip` — required by server/services/gdelt.ts; must be `--save` not `--no-save`
- `react-globe.gl`, `three`, `howler` — installed via npm

## Data Sources (free, no API key)
- USGS M2.5+ earthquakes — every 5 min
- NOAA/NWS extreme weather alerts — every 15 min
- GDACS global disasters RSS — every 30 min
- WHO/ReliefWeb health outbreaks — every 60 min

## Alert Categories
7 categories total: MILITAIRE, CATASTROPHE, MÉTÉO, SANTÉ, INFO, POLITIQUE, ALL
- normalizeCategory() in alert-feed.tsx maps alert.type → display category
- DB schema uses `category` field (string); new feeds set it directly
- Globe pins colored by category: orange=CATASTROPHE, blue=MÉTÉO, green=SANTÉ, red=MILITAIRE

## CSS Constraints
- In `index.css` @apply directives: only use standard Tailwind opacity values (/5 /10 /20 /25 /30 /40 /50 /60 /70 /80 /90)
- Non-standard opacities like /8, /4, /12 FAIL in @apply (work fine in TSX JIT)
- bg-background/65 → must write as bg-background/60 or use inline style

## Globe WebGL
- Replit's screenshot browser has no GPU → WebGL fails → need GlobeErrorBoundary (class component)
- ErrorBoundary shows "Globe 3D indisponible" fallback — real user browsers work fine
- Globe inner function is GlobeViewInner; exported as GlobeView (wraps with boundary)

## Env Vars Needed
- `GROQ_API_KEY` — Groq AI for translations/briefings (user needs to add in Replit Secrets)
- `TWITTER_BEARER_TOKEN` — optional Twitter feed (skipped if missing)

## TTS System (sounds.ts)
- Uses browser SpeechSynthesis API
- Language: fr-FR, rate 0.92, prefers French voice
- Activated for: critical + high severity, disasters, health alerts
- Queue of max 3 items; separate from sound effects queue
- Toggle via setTtsEnabled() / isTtsEnabled() + localStorage persist

## Database
- Auto-migrates via runMigrations() in server/db.ts — never use drizzle-kit push (blocks interactively)
- Schema in shared/schema.ts

## Vercel Deployment
- User wants Vercel (was on Netlify which blocked their domain)
- Not yet configured — needs vercel.json + build output setup
