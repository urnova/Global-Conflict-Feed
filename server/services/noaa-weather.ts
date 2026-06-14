/**
 * NOAA / NWS Weather Alerts Service — Argos V7
 * Source: National Weather Service (public API, no key needed)
 * + GDACS Global Disaster Alert RSS
 * + ReliefWeb API (free, OCHA)
 */

import { createHash } from 'crypto';
import { storage } from '../storage';
import { broadcast } from '../ws';

function fingerprint(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 32);
}

// ─── NOAA/NWS Alerts ─────────────────────────────────────────────────────────
// Covers USA + territories
const NOAA_URL = 'https://api.weather.gov/alerts/active?status=actual&message_type=alert&urgency=Immediate,Expected&severity=Extreme,Severe';

function noaaEventToType(event: string): string {
  const e = event.toLowerCase();
  if (e.includes('hurricane') || e.includes('typhoon')) return 'hurricane';
  if (e.includes('tornado')) return 'tornado';
  if (e.includes('tsunami')) return 'tsunami';
  if (e.includes('flood')) return 'flood';
  if (e.includes('wildfire') || e.includes('fire')) return 'wildfire';
  if (e.includes('blizzard') || e.includes('snow') || e.includes('winter')) return 'cold-snap';
  if (e.includes('heat')) return 'heatwave';
  if (e.includes('earthquake')) return 'earthquake';
  if (e.includes('volcano')) return 'volcano';
  return 'storm';
}

function noaaSeverityToLevel(severity: string): { level: string; score: number } {
  switch (severity?.toLowerCase()) {
    case 'extreme': return { level: 'critical', score: 9 };
    case 'severe': return { level: 'high', score: 7 };
    case 'moderate': return { level: 'medium', score: 5 };
    default: return { level: 'low', score: 3 };
  }
}

export async function fetchNoaaAlerts(): Promise<number> {
  let newCount = 0;
  try {
    const res = await fetch(NOAA_URL, {
      headers: { 'User-Agent': 'ARGOS-Intelligence/7.0 (global-monitor)', Accept: 'application/geo+json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return 0;

    const data: any = await res.json();
    const features = (data.features ?? []).slice(0, 30);

    for (const f of features) {
      const p = f.properties;
      if (!p.headline || !p.areaDesc) continue;

      // Get centroid from geometry or use default US position
      let lat = 39.5, lng = -98.35;
      if (f.geometry?.coordinates) {
        const coords = f.geometry.coordinates.flat(Infinity);
        if (coords.length >= 2) { lng = coords[0]; lat = coords[1]; }
      }

      const fp = fingerprint(`noaa-${p.id ?? p.headline}`);
      const type = noaaEventToType(p.event ?? '');
      const { level, score } = noaaSeverityToLevel(p.severity);
      const time = p.sent ? new Date(p.sent) : new Date();

      const title = `${p.event} — ${p.areaDesc?.split(';')[0].trim()}`;
      const description = p.description?.slice(0, 300) ?? p.headline ?? '';

      const alert = await storage.createAlertIfNew({
        title: title.slice(0, 200),
        description: description.slice(0, 500),
        lat: String(lat),
        lng: String(lng),
        country: 'États-Unis',
        countryCode: 'US',
        source: 'NOAA/NWS',
        type,
        category: 'WEATHER',
        sourceType: 'NOAA',
        severity: level,
        status: 'active',
        fingerprint: fp,
        severityScore: score,
        isActive: true,
        eventStart: time,
        aiVerified: true,
        aiLabel: title.slice(0, 200),
        originLat: null,
        originLng: null,
      });

      if (alert) { newCount++; broadcast('new_alert', alert); }
    }
  } catch (err) {
    console.error('[noaa] Error:', err instanceof Error ? err.message : err);
  }
  return newCount;
}

// ─── GDACS Global Disaster Alert and Coordination System ─────────────────────
const GDACS_RSS = 'https://www.gdacs.org/xml/rss.xml';

function gdacsAlertToType(title: string, desc: string): { type: string; category: string } {
  const text = (title + ' ' + desc).toLowerCase();
  if (text.includes('earthquake') || text.includes('seismic')) return { type: 'earthquake', category: 'DISASTER' };
  if (text.includes('cyclone') || text.includes('typhoon') || text.includes('hurricane')) return { type: 'hurricane', category: 'WEATHER' };
  if (text.includes('flood')) return { type: 'flood', category: 'DISASTER' };
  if (text.includes('volcano')) return { type: 'volcano', category: 'DISASTER' };
  if (text.includes('tsunami')) return { type: 'tsunami', category: 'DISASTER' };
  if (text.includes('wildfire') || text.includes('fire')) return { type: 'wildfire', category: 'DISASTER' };
  if (text.includes('drought')) return { type: 'drought', category: 'WEATHER' };
  return { type: 'storm', category: 'DISASTER' };
}

function gdacsAlertLevelToSeverity(alert: string): { level: string; score: number } {
  switch (alert?.toLowerCase()) {
    case 'red': return { level: 'critical', score: 9 };
    case 'orange': return { level: 'high', score: 7 };
    case 'green': return { level: 'medium', score: 5 };
    default: return { level: 'medium', score: 4 };
  }
}

async function parseSimpleXml(xml: string, tag: string): Promise<string[]> {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const matches: string[] = [];
  let m;
  while ((m = regex.exec(xml)) !== null) matches.push(m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim());
  return matches;
}

function extractGdacsCoords(desc: string): { lat: number; lng: number } | null {
  const latMatch = desc.match(/Lat:\s*([-\d.]+)/i) ?? desc.match(/latitude[:\s]+([-\d.]+)/i);
  const lngMatch = desc.match(/Lon:\s*([-\d.]+)/i) ?? desc.match(/longitude[:\s]+([-\d.]+)/i);
  if (latMatch && lngMatch) return { lat: parseFloat(latMatch[1]), lng: parseFloat(lngMatch[1]) };
  return null;
}

export async function fetchGdacsAlerts(): Promise<number> {
  let newCount = 0;
  try {
    const res = await fetch(GDACS_RSS, {
      headers: { 'User-Agent': 'ARGOS-Intelligence/7.0', Accept: 'application/rss+xml,application/xml,text/xml' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return 0;

    const xml = await res.text();

    // Parse items manually (lightweight, no deps)
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const item = itemMatch[1];
      const title = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() ?? '';
      const desc = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() ?? '';
      const link = item.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() ?? '';
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
      const alertLevel = item.match(/<gdacs:alertlevel[^>]*>([\s\S]*?)<\/gdacs:alertlevel>/i)?.[1]?.trim() ?? '';
      const countryName = item.match(/<gdacs:country[^>]*>([\s\S]*?)<\/gdacs:country>/i)?.[1]?.trim() ?? '';
      const iso = item.match(/<gdacs:iso3[^>]*>([\s\S]*?)<\/gdacs:iso3>/i)?.[1]?.trim();

      if (!title) continue;

      const coords = extractGdacsCoords(desc) ?? extractGdacsCoords(item);
      if (!coords) continue;

      const fp = fingerprint(`gdacs-${link || title}`);
      const { type, category } = gdacsAlertToType(title, desc);
      const { level, score } = gdacsAlertLevelToSeverity(alertLevel);
      const time = pubDate ? new Date(pubDate) : new Date();

      const alert = await storage.createAlertIfNew({
        title: `${title}`.slice(0, 200),
        description: desc.slice(0, 500),
        lat: String(coords.lat),
        lng: String(coords.lng),
        country: countryName || null,
        countryCode: iso?.slice(0, 2).toUpperCase() ?? null,
        source: 'GDACS',
        type,
        category,
        sourceType: 'GDACS',
        severity: level,
        status: 'active',
        fingerprint: fp,
        severityScore: score,
        isActive: true,
        eventStart: time,
        aiVerified: true,
        aiLabel: title.slice(0, 200),
        originLat: null,
        originLng: null,
      });

      if (alert) { newCount++; broadcast('new_alert', alert); }
    }
  } catch (err) {
    console.error('[gdacs] Error:', err instanceof Error ? err.message : err);
  }
  return newCount;
}

// ─── WHO / ReliefWeb Health Alerts ───────────────────────────────────────────
const WHO_FEEDS = [
  'https://www.who.int/rss-feeds/news-releases.xml',
  'https://reliefweb.int/updates/rss.xml?search=disease+outbreak',
];

const HEALTH_KEYWORDS = ['outbreak', 'epidemic', 'pandemic', 'virus', 'disease', 'cholera', 'ebola', 'mpox', 'monkeypox', 'dengue', 'plague', 'avian flu', 'h5n1', 'alert', 'emergency', 'spread', 'cluster', 'contamination', 'infection', 'mortality', 'fatality', 'deaths', 'vaccination', 'vaccine', 'pathogen'];

// Geographic clues → approximate coordinates
const GEO_HINTS: Record<string, { lat: number; lng: number; cc: string; country: string }> = {
  'africa': { lat: 1.0, lng: 20.0, cc: 'ZZ', country: 'Afrique' },
  'west africa': { lat: 8.0, lng: -5.0, cc: 'ZZ', country: 'Afrique de l\'Ouest' },
  'central africa': { lat: 3.0, lng: 23.0, cc: 'ZZ', country: 'Afrique Centrale' },
  'congo': { lat: -4.3, lng: 15.3, cc: 'CD', country: 'RDC' },
  'drc': { lat: -4.3, lng: 15.3, cc: 'CD', country: 'RDC' },
  'nigeria': { lat: 9.1, lng: 8.7, cc: 'NG', country: 'Nigeria' },
  'china': { lat: 35.9, lng: 104.2, cc: 'CN', country: 'Chine' },
  'india': { lat: 20.6, lng: 79.0, cc: 'IN', country: 'Inde' },
  'southeast asia': { lat: 12.0, lng: 105.0, cc: 'ZZ', country: 'Asie du Sud-Est' },
  'middle east': { lat: 30.0, lng: 45.0, cc: 'ZZ', country: 'Moyen-Orient' },
  'europe': { lat: 50.0, lng: 15.0, cc: 'ZZ', country: 'Europe' },
  'global': { lat: 20.0, lng: 0.0, cc: 'ZZ', country: 'Mondial' },
};

function extractHealthGeo(text: string): { lat: number; lng: number; cc: string; country: string } {
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(GEO_HINTS)) {
    if (lower.includes(key)) return val;
  }
  return { lat: 20.0, lng: 0.0, cc: 'ZZ', country: 'Mondial' };
}

function isHealthRelevant(title: string, desc: string): boolean {
  const text = (title + ' ' + desc).toLowerCase();
  return HEALTH_KEYWORDS.some(kw => text.includes(kw));
}

export async function fetchHealthAlerts(): Promise<number> {
  let newCount = 0;
  for (const feedUrl of WHO_FEEDS) {
    try {
      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'ARGOS-Intelligence/7.0', Accept: 'application/rss+xml,application/xml,text/xml' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let itemMatch;

      while ((itemMatch = itemRegex.exec(xml)) !== null) {
        const item = itemMatch[1];
        const title = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() ?? '';
        const desc = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim() ?? '';
        const link = item.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() ?? '';
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();

        if (!title || !isHealthRelevant(title, desc)) continue;

        const fp = fingerprint(`health-${link || title}`);
        const geo = extractHealthGeo(title + ' ' + desc);
        const time = pubDate ? new Date(pubDate) : new Date();

        // Determine severity based on keywords
        const text = (title + ' ' + desc).toLowerCase();
        let severity = 'medium', score = 5;
        if (text.includes('pandemic') || text.includes('emergency') || text.includes('global')) { severity = 'high'; score = 8; }
        if (text.includes('ebola') || text.includes('plague') || text.includes('deaths') || text.includes('fatalities')) { severity = 'high'; score = 8; }

        const alert = await storage.createAlertIfNew({
          title: title.slice(0, 200),
          description: desc.slice(0, 500),
          lat: String(geo.lat),
          lng: String(geo.lng),
          country: geo.country,
          countryCode: geo.cc,
          source: feedUrl.includes('who.int') ? 'OMS/WHO' : 'ReliefWeb',
          type: text.includes('pandemic') ? 'pandemic' : text.includes('epidemic') ? 'epidemic' : 'outbreak',
          category: 'HEALTH',
          sourceType: 'WHO',
          severity,
          status: 'active',
          fingerprint: fp,
          severityScore: score,
          isActive: true,
          eventStart: time,
          aiVerified: true,
          aiLabel: title.slice(0, 200),
          originLat: null,
          originLng: null,
        });

        if (alert) { newCount++; broadcast('new_alert', alert); }
      }
    } catch (err) {
      console.error('[health] Feed error:', feedUrl, err instanceof Error ? err.message : err);
    }
  }
  return newCount;
}
