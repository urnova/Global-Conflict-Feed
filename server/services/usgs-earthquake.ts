/**
 * USGS Earthquake Service — Argos V7
 * Source: USGS Earthquake Hazards Program (100% public, no API key needed)
 * Feeds:
 *   - all_hour: all earthquakes last hour (real-time)
 *   - significant_month: M4.5+ last 30 days (context)
 */

import { createHash } from 'crypto';
import { storage } from '../storage.js';
import { broadcast } from '../ws.js';

const USGS_FEEDS = [
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
];

function fingerprint(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 32);
}

function magnitudeToSeverity(mag: number): { severity: string; score: number } {
  if (mag >= 7.0) return { severity: 'critical', score: 10 };
  if (mag >= 6.0) return { severity: 'critical', score: 9 };
  if (mag >= 5.0) return { severity: 'high', score: 7 };
  if (mag >= 4.0) return { severity: 'medium', score: 5 };
  if (mag >= 3.0) return { severity: 'low', score: 3 };
  return { severity: 'low', score: 1 };
}

function magnitudeToType(mag: number, place: string): string {
  const lower = place.toLowerCase();
  if (lower.includes('ocean') || lower.includes('sea') || lower.includes('trench')) {
    if (mag >= 6.5) return 'tsunami'; // Potential tsunami risk
  }
  return 'earthquake';
}

export async function fetchEarthquakeAlerts(): Promise<number> {
  let newCount = 0;

  for (const feedUrl of USGS_FEEDS) {
    try {
      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'ARGOS-Intelligence/7.0 (global-monitor)' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;

      const data: any = await res.json();
      const features = data.features ?? [];

      for (const feature of features) {
        const props = feature.properties;
        const coords = feature.geometry?.coordinates;
        if (!coords || !props.mag || props.mag < 2.5) continue;

        const mag = props.mag;
        const place = props.place ?? 'Localisation inconnue';
        const time = new Date(props.time);
        const fp = fingerprint(`usgs-${feature.id}`);

        const { severity, score } = magnitudeToSeverity(mag);
        const type = magnitudeToType(mag, place);

        // Extract country-ish info from USGS place string (e.g. "10km SSW of Hualien City, Taiwan")
        const placeMatch = place.match(/,\s*([^,]+)$/);
        const locationHint = placeMatch ? placeMatch[1].trim() : place;

        const title = `Séisme M${mag.toFixed(1)} — ${place}`;
        const description = `Magnitude ${mag.toFixed(1)} à ${Math.abs(coords[2] ?? 0).toFixed(1)}km de profondeur. Localisation: ${place}. Données USGS.`;

        const alert = await storage.createAlertIfNew({
          title,
          description,
          lat: String(coords[1]),
          lng: String(coords[0]),
          country: locationHint,
          countryCode: null,
          source: 'USGS',
          type,
          category: 'DISASTER',
          sourceType: 'USGS',
          severity,
          status: 'active',
          fingerprint: fp,
          severityScore: score,
          isActive: true,
          eventStart: time,
          aiVerified: true,
          aiLabel: title,
          originLat: null,
          originLng: null,
        });

        if (alert) {
          newCount++;
          broadcast('new_alert', alert);
        }
      }
    } catch (err) {
      console.error(`[usgs] Feed error:`, err instanceof Error ? err.message : err);
    }
  }

  return newCount;
}
