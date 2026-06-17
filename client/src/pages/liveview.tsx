/**
 * LiveView (Espace) — Argos V7
 * Stations spatiales ISS + Tiangong en temps réel + calendrier lancements
 * NASA EPIC Earth imagery · Launch Library 2 API · wheretheiss.at
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import { useAlerts } from "@/hooks/use-alerts";
import {
  Satellite, ArrowLeft, Thermometer, Wind, Eye, Clock,
  AlertTriangle, Zap, MapPin, Search, ExternalLink, Video, VideoOff,
  Rocket, RefreshCw, Globe2, Play, Calendar,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CamCity {
  id: string;
  name: string;
  lat: number;
  lng: number;
  timezone: string;
  tension?: 'critical' | 'high' | 'medium';
  earthcamId?: string;
  // Skylinewebcams are NOT embedded (X-Frame-Options blocks them).
  // We store the URL only for the external link.
  skylineUrl?: string;
}

interface Country {
  id: string;
  name: string;
  countryCode: string;
  isConflict: boolean;
  isSpace?: boolean;
  cities: CamCity[];
}

interface ISSData {
  lat: number; lng: number; altitude: number; velocity: number;
  timestamp: number; footprint: number; visibility: string;
}

interface Weather {
  temp: number; feelsLike: number; humidity: number;
  windSpeed: number; windDir: string; visibility: number;
  condition: string;
}

type ViewLevel = 'countries' | 'cities' | 'dashboard' | 'iss' | 'tiangong';
type SpaceTab = 'iss' | 'tiangong' | 'launches';

// ── Launch Library 2 types ─────────────────────────────────────────────────────

interface Launch {
  id: string;
  name: string;
  net: string;
  status: { id: number; name: string; abbrev: string };
  rocket: { configuration: { name: string; full_name: string } };
  launch_service_provider: { name: string; type: string };
  mission: { name: string; description: string; orbit: { name: string } } | null;
  links: { webcast: string | null; webcast_live: boolean; image: string | null };
  pad: { name: string; location: { name: string } };
}

// ── Catalogue des pays et villes ──────────────────────────────────────────────

const COUNTRIES: Country[] = [
  {
    id: 'iss', name: 'Station Spatiale (ISS)', countryCode: 'ISS',
    isConflict: false, isSpace: true, cities: [],
  },
  {
    id: 'tiangong', name: 'Station Tiangong (CSS)', countryCode: 'CN',
    isConflict: false, isSpace: true, cities: [],
  },
  {
    id: 'ua', name: 'Ukraine', countryCode: 'UA', isConflict: true,
    cities: [
      { id: 'kyiv', name: 'Kyiv', lat: 50.4501, lng: 30.5234, timezone: 'Europe/Kiev', tension: 'critical',
        skylineUrl: 'https://www.skylinewebcams.com/en/webcam/ukraine/kyiv/city/kyiv-city.html' },
      { id: 'odessa', name: 'Odessa', lat: 46.4825, lng: 30.7233, timezone: 'Europe/Kiev', tension: 'critical' },
      { id: 'kharkiv', name: 'Kharkiv', lat: 49.9935, lng: 36.2304, timezone: 'Europe/Kiev', tension: 'critical' },
    ],
  },
  {
    id: 'il', name: 'Israël', countryCode: 'IL', isConflict: true,
    cities: [
      { id: 'jerusalem', name: 'Jérusalem', lat: 31.7683, lng: 35.2137, timezone: 'Asia/Jerusalem', tension: 'critical',
        skylineUrl: 'https://www.skylinewebcams.com/en/webcam/israel/jerusalem/city/jerusalem-city.html' },
      { id: 'telaviv', name: 'Tel Aviv', lat: 32.0853, lng: 34.7818, timezone: 'Asia/Jerusalem', tension: 'high' },
    ],
  },
  {
    id: 'lb', name: 'Liban', countryCode: 'LB', isConflict: true,
    cities: [
      { id: 'beirut', name: 'Beyrouth', lat: 33.8886, lng: 35.4955, timezone: 'Asia/Beirut', tension: 'high',
        skylineUrl: 'https://www.skylinewebcams.com/en/webcam/lebanon/beirut/city/beirut.html' },
    ],
  },
  {
    id: 'sy', name: 'Syrie', countryCode: 'SY', isConflict: true,
    cities: [
      { id: 'damascus', name: 'Damas', lat: 33.5138, lng: 36.2765, timezone: 'Asia/Damascus', tension: 'high' },
      { id: 'aleppo', name: 'Alep', lat: 36.2021, lng: 37.1343, timezone: 'Asia/Damascus', tension: 'high' },
    ],
  },
  {
    id: 'ps', name: 'Palestine', countryCode: 'PS', isConflict: true,
    cities: [
      { id: 'gaza', name: 'Gaza', lat: 31.5017, lng: 34.4668, timezone: 'Asia/Gaza', tension: 'critical' },
      { id: 'ramallah', name: 'Ramallah', lat: 31.9038, lng: 35.2034, timezone: 'Asia/Hebron', tension: 'high' },
    ],
  },
  {
    id: 'ru', name: 'Russie', countryCode: 'RU', isConflict: true,
    cities: [
      { id: 'moscow', name: 'Moscou', lat: 55.7558, lng: 37.6173, timezone: 'Europe/Moscow' },
      { id: 'stpetersburg', name: 'Saint-Pétersbourg', lat: 59.9311, lng: 30.3609, timezone: 'Europe/Moscow' },
    ],
  },
  {
    id: 'tr', name: 'Turquie', countryCode: 'TR', isConflict: false,
    cities: [
      { id: 'istanbul', name: 'Istanbul', lat: 41.0082, lng: 28.9784, timezone: 'Europe/Istanbul', tension: 'medium',
        skylineUrl: 'https://www.skylinewebcams.com/en/webcam/turkey/istanbul/city/bosphore.html' },
      { id: 'ankara', name: 'Ankara', lat: 39.9334, lng: 32.8597, timezone: 'Europe/Istanbul' },
    ],
  },
  {
    id: 'fr', name: 'France', countryCode: 'FR', isConflict: false,
    cities: [
      { id: 'paris', name: 'Paris', lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris', earthcamId: 'eiffeltower2' },
      { id: 'marseille', name: 'Marseille', lat: 43.2965, lng: 5.3698, timezone: 'Europe/Paris',
        skylineUrl: 'https://www.skylinewebcams.com/en/webcam/france/provence-alpes-cote-dazur/marseille/vieux-port.html' },
    ],
  },
  {
    id: 'us', name: 'États-Unis', countryCode: 'US', isConflict: false,
    cities: [
      { id: 'newyork', name: 'New York', lat: 40.7580, lng: -73.9855, timezone: 'America/New_York', earthcamId: 'timessquare4' },
      { id: 'losangeles', name: 'Los Angeles', lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles' },
    ],
  },
  {
    id: 'gb', name: 'Royaume-Uni', countryCode: 'GB', isConflict: false,
    cities: [
      { id: 'london', name: 'Londres', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London', earthcamId: 'londonwestminster' },
    ],
  },
  {
    id: 'jp', name: 'Japon', countryCode: 'JP', isConflict: false,
    cities: [
      { id: 'tokyo', name: 'Tokyo', lat: 35.6595, lng: 139.7004, timezone: 'Asia/Tokyo', earthcamId: 'tokyoshibuya' },
      { id: 'osaka', name: 'Osaka', lat: 34.6937, lng: 135.5023, timezone: 'Asia/Tokyo' },
    ],
  },
  {
    id: 'it', name: 'Italie', countryCode: 'IT', isConflict: false,
    cities: [
      { id: 'rome', name: 'Rome', lat: 41.9009, lng: 12.4833, timezone: 'Europe/Rome', earthcamId: 'trevifrountain' },
      { id: 'venice', name: 'Venise', lat: 45.4408, lng: 12.3155, timezone: 'Europe/Rome',
        skylineUrl: 'https://www.skylinewebcams.com/en/webcam/italia/veneto/venezia/gran-canal.html' },
    ],
  },
  {
    id: 'cz', name: 'Tchéquie', countryCode: 'CZ', isConflict: false,
    cities: [
      { id: 'prague', name: 'Prague', lat: 50.0755, lng: 14.4378, timezone: 'Europe/Prague', earthcamId: 'prague' },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function flagImg(code: string, size: '16x12' | '24x18' | '32x24' = '24x18') {
  if (code === 'ISS') return null;
  return `https://flagcdn.com/${size}/${code.toLowerCase()}.png`;
}

const TENSION_COLOR: Record<string, string> = {
  critical: '#FF003C',
  high: '#FFB800',
  medium: '#00F0FF',
};

const TENSION_LABEL: Record<string, string> = {
  critical: 'CRITIQUE',
  high: 'ÉLEVÉ',
  medium: 'TENSION',
};

function countryMaxTension(country: Country): 'critical' | 'high' | 'medium' | undefined {
  if (country.cities.some(c => c.tension === 'critical')) return 'critical';
  if (country.cities.some(c => c.tension === 'high')) return 'high';
  if (country.cities.some(c => c.tension === 'medium')) return 'medium';
  if (country.isConflict) return 'medium';
  return undefined;
}

function tensionScore(t?: string) {
  if (t === 'critical') return 3;
  if (t === 'high') return 2;
  if (t === 'medium') return 1;
  return 0;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Only EarthCam supports iframe embedding. Skylinewebcams blocks with X-Frame-Options.
function getEmbedUrl(city: CamCity): string | null {
  if (city.earthcamId) return `https://www.earthcam.com/camembed.php?id=${city.earthcamId}`;
  return null;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useSatTracker(noradId: number) {
  const [sat, setSat] = useState<ISSData | null>(null);
  useEffect(() => {
    let active = true;
    async function fetchSat() {
      try {
        const res = await fetch(`https://api.wheretheiss.at/v1/satellites/${noradId}`);
        if (!res.ok || !active) return;
        const d = await res.json();
        setSat({ lat: d.latitude, lng: d.longitude, altitude: d.altitude, velocity: d.velocity, timestamp: d.timestamp, footprint: d.footprint, visibility: d.visibility });
      } catch {}
    }
    fetchSat();
    const t = setInterval(fetchSat, 5000);
    return () => { active = false; clearInterval(t); };
  }, [noradId]);
  return sat;
}

function useISSTracker() { return useSatTracker(25544); }
function useTiangongTracker() { return useSatTracker(48274); }

interface EpicImage { image: string; date: string; caption?: string; }

function useEpicImages() {
  const [images, setImages] = useState<EpicImage[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('https://epic.gsfc.nasa.gov/api/natural/images')
      .then(r => r.json())
      .then((data: EpicImage[]) => setImages(data.slice(0, 10)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { images, loading };
}

function epicUrl(img: EpicImage): string {
  const d = img.date.split(' ')[0];
  const [y, m, day] = d.split('-');
  return `https://epic.gsfc.nasa.gov/archive/natural/${y}/${m}/${day}/jpg/${img.image}.jpg`;
}

// ── Launch Library 2 Hook ─────────────────────────────────────────────────────

const AGENCY_COLOR: Record<string, string> = {
  'SpaceX': '#005288', 'NASA': '#0B3D91', 'ESA': '#003299',
  'CNSA': '#DE2910', 'Roscosmos': '#003F87', 'United Launch Alliance': '#2E5AA8',
  'Rocket Lab': '#E60012', 'ISRO': '#FF6B00', 'JAXA': '#003087',
  'Arianespace': '#0055A5', 'Blue Origin': '#1D4060',
};

function agencyColor(name: string): string {
  for (const [k, v] of Object.entries(AGENCY_COLOR)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '#334155';
}

const STATUS_COLOR: Record<string, string> = {
  'Go': '#22c55e', 'TBC': '#FFB800', 'TBD': '#64748b',
  'Success': '#16a34a', 'Failure': '#FF003C', 'Hold': '#f97316',
  'In Flight': '#00F0FF',
};

function formatCountdown(netStr: string): { label: string; ms: number } {
  const ms = new Date(netStr).getTime() - Date.now();
  if (ms < 0) return { label: 'Lancé', ms };
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (d > 30) return { label: `J-${d}`, ms };
  if (d > 0) return { label: `J-${d} ${h}h`, ms };
  if (h > 0) return { label: `${h}h ${m}m`, ms };
  if (m > 0) return { label: `${m}m ${s}s`, ms };
  return { label: `${s}s`, ms };
}

function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function useLaunches() {
  const [upcoming, setUpcoming] = useState<Launch[]>([]);
  const [previous, setPrevious] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [upRes, prevRes] = await Promise.all([
        fetch('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=20&format=json'),
        fetch('https://ll.thespacedevs.com/2.2.0/launch/previous/?limit=10&format=json&ordering=-net'),
      ]);
      if (upRes.ok) setUpcoming((await upRes.json()).results ?? []);
      if (prevRes.ok) setPrevious((await prevRes.json()).results ?? []);
      setLastRefresh(new Date());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 3600 * 1000);
    return () => clearInterval(t);
  }, [fetchAll]);

  return { upcoming, previous, loading, lastRefresh, refresh: fetchAll };
}

function useWeather(lat: number, lng: number, enabled: boolean) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);
  const cache = useRef<Record<string, Weather>>({});
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;

  useEffect(() => {
    if (!enabled) return;
    if (cache.current[key]) { setWeather(cache.current[key]); return; }
    setLoading(true);
    fetch(`https://wttr.in/${lat},${lng}?format=j1`)
      .then(r => r.json())
      .then(d => {
        const c = d?.current_condition?.[0];
        if (!c) return;
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
        const w: Weather = {
          temp: Number(c.temp_C),
          feelsLike: Number(c.FeelsLikeC),
          humidity: Number(c.humidity),
          windSpeed: Number(c.windspeedKmph),
          windDir: dirs[Math.round(Number(c.winddirDegree) / 45) % 8],
          visibility: Number(c.visibility),
          condition: c.weatherDesc?.[0]?.value ?? '',
        };
        cache.current[key] = w;
        setWeather(w);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [key, enabled]);

  return { weather, loading };
}

function useLocalClock(timezone: string) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const now = new Date();
  return {
    time: now.toLocaleTimeString('fr-FR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: now.toLocaleDateString('fr-FR', { timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long' }),
  };
}

// ── Components ────────────────────────────────────────────────────────────────

function TensionBadge({ level }: { level: string }) {
  const color = TENSION_COLOR[level];
  if (!color) return null;
  return (
    <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 leading-none"
      style={{ color, borderColor: `${color}40`, background: `${color}15` }}>
      {TENSION_LABEL[level]}
    </span>
  );
}

function Breadcrumb({ view, country, city, onHome, onBackToCountry }: {
  view: ViewLevel; country: Country | null; city: CamCity | null;
  onHome: () => void; onBackToCountry: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40">
      <button onClick={onHome} className="hover:text-primary transition-colors">Tout</button>
      {view === 'iss' && (
        <><span className="mx-0.5 text-white/15">/</span><span className="text-white/70">Station Spatiale ISS</span></>
      )}
      {view === 'tiangong' && (
        <><span className="mx-0.5 text-white/15">/</span><span className="text-white/70">Station Tiangong</span></>
      )}
      {(view === 'cities' || view === 'dashboard') && country && (
        <>
          <span className="mx-0.5 text-white/15">/</span>
          {view === 'dashboard'
            ? <button onClick={onBackToCountry} className="hover:text-primary transition-colors">{country.name}</button>
            : <span className="text-white/70">{country.name}</span>
          }
        </>
      )}
      {view === 'dashboard' && city && (
        <><span className="mx-0.5 text-white/15">/</span><span className="text-white font-bold">{city.name}</span></>
      )}
    </div>
  );
}

// ── Country card ──────────────────────────────────────────────────────────────

function CountryCard({ country, alertCount24h, onClick }: {
  country: Country; alertCount24h: number; onClick: () => void;
}) {
  if (country.isSpace) {
    const isISS = country.id === 'iss';
    const accentColor = isISS ? '#00F0FF' : '#FF4500';
    const label = isISS ? 'ISS · 25544' : 'CSS · 48274';
    const subLabel = isISS ? 'Station US/Europe/Japon/Russie' : 'Station spatiale chinoise';
    const liveLabel = isISS ? 'Données NASA temps réel' : 'Données CNSA temps réel';
    const flagCode = isISS ? null : 'cn';
    return (
      <button
        onClick={onClick}
        className="group relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
        style={{
          background: `linear-gradient(135deg, ${accentColor}12 0%, rgba(0,0,0,0.75) 100%)`,
          borderColor: `${accentColor}40`,
          boxShadow: `0 0 24px ${accentColor}10`,
        }}
      >
        <style>{`@keyframes spin-slow { to { transform: rotate(360deg); } }`}</style>
        <div className="flex items-center gap-2.5">
          {flagCode
            ? <img src={`https://flagcdn.com/24x18/${flagCode}.png`} alt="CN" className="w-7 h-5 rounded-sm object-cover shrink-0" />
            : <Satellite className="w-6 h-6 shrink-0" style={{ color: accentColor, animation: 'spin-slow 8s linear infinite' }} />
          }
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-bold text-white">{country.name}</div>
            <div className="text-[9px] font-mono mt-0.5" style={{ color: `${accentColor}60` }}>{label} · {subLabel}</div>
          </div>
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded border shrink-0" style={{ color: accentColor, borderColor: `${accentColor}40`, background: `${accentColor}15` }}>LIVE</span>
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-ping inline-block" style={{ background: accentColor }} />
          {liveLabel}
        </div>
      </button>
    );
  }

  const maxTension = countryMaxTension(country);
  const color = maxTension ? TENSION_COLOR[maxTension] : undefined;
  const isCritical = maxTension === 'critical';

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
      style={{
        background: isCritical
          ? 'linear-gradient(135deg, rgba(255,0,60,0.1) 0%, rgba(0,0,0,0.85) 100%)'
          : country.isConflict
            ? 'linear-gradient(135deg, rgba(255,85,0,0.06) 0%, rgba(0,0,0,0.8) 100%)'
            : 'rgba(255,255,255,0.03)',
        borderColor: color ? `${color}45` : 'rgba(255,255,255,0.08)',
        boxShadow: isCritical ? `0 0 20px rgba(255,0,60,0.12)` : 'none',
      }}
    >
      {isCritical && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ animation: 'pulse 2s ease-in-out infinite', boxShadow: `0 0 0 1px rgba(255,0,60,0.25)` }} />
      )}

      {/* Flag + name */}
      <div className="flex items-center gap-2.5">
        {flagImg(country.countryCode) && (
          <img src={flagImg(country.countryCode)!} alt="" className="w-7 h-5 rounded-sm object-cover shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-white leading-tight">{country.name}</div>
          <div className="text-[9px] font-mono text-white/30 mt-0.5">
            {country.cities.length} ville{country.cities.length > 1 ? 's' : ''}
          </div>
        </div>
        {maxTension && <TensionBadge level={maxTension} />}
      </div>

      {/* Alert count */}
      {alertCount24h > 0 && (
        <div className="flex items-center gap-1.5 text-[8px] font-mono"
          style={{ color: isCritical ? '#FF003C' : '#FFB80080' }}>
          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
          <span>{alertCount24h} alerte{alertCount24h > 1 ? 's' : ''} · 24h</span>
        </div>
      )}
    </button>
  );
}

// ── City card ─────────────────────────────────────────────────────────────────

function CityCard({ city, countryCode, alertCount, onClick }: {
  city: CamCity; countryCode: string; alertCount: number; onClick: () => void;
}) {
  const color = city.tension ? TENSION_COLOR[city.tension] : undefined;
  const hasEmbed = !!city.earthcamId;
  const hasExternalCam = !!(city.skylineUrl || city.earthcamId);

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
      style={{
        background: city.tension === 'critical'
          ? 'linear-gradient(135deg, rgba(255,0,60,0.08) 0%, rgba(0,0,0,0.85) 100%)'
          : 'rgba(255,255,255,0.03)',
        borderColor: color ? `${color}40` : 'rgba(255,255,255,0.08)',
        boxShadow: city.tension === 'critical' ? '0 0 16px rgba(255,0,60,0.1)' : 'none',
      }}
    >
      <div className="flex items-center gap-2.5">
        <img src={`https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`} alt="" className="w-6 h-4 rounded-sm shrink-0" />
        <span className="text-[13px] font-bold text-white flex-1 min-w-0">{city.name}</span>
        {city.tension && <TensionBadge level={city.tension} />}
      </div>

      <div className="flex items-center gap-1.5 text-[8px] font-mono"
        style={{ color: hasEmbed ? '#22c55e' : hasExternalCam ? '#00F0FF80' : '#ffffff20' }}>
        {hasEmbed
          ? <><Video className="w-2.5 h-2.5 shrink-0" /><span>Caméra intégrée</span></>
          : hasExternalCam
            ? <><ExternalLink className="w-2.5 h-2.5 shrink-0" /><span>Caméra externe</span></>
            : <><VideoOff className="w-2.5 h-2.5 shrink-0" /><span>Pas de caméra</span></>
        }
      </div>

      {alertCount > 0 && (
        <div className="flex items-center gap-1 text-[8px] font-mono text-amber-400/60">
          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
          <span>{alertCount} alerte{alertCount > 1 ? 's' : ''}</span>
        </div>
      )}
    </button>
  );
}

// ── Recommendations section ───────────────────────────────────────────────────

function Recommendations({ countries, alertsByCountry, onSelect }: {
  countries: Country[];
  alertsByCountry: Record<string, number>;
  onSelect: (c: Country) => void;
}) {
  const hotZones = countries
    .filter(c => !c.isSpace)
    .map(c => ({
      country: c,
      tension: countryMaxTension(c),
      alerts: alertsByCountry[c.countryCode] ?? 0,
      score: tensionScore(countryMaxTension(c)) * 1000 + (alertsByCountry[c.countryCode] ?? 0),
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (hotZones.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-0.5 h-4 rounded-full bg-destructive/70" />
        <span className="text-[10px] font-black uppercase tracking-widest text-destructive/80">Zones sous surveillance</span>
        <span className="text-[8px] font-mono text-white/20">— basé sur les alertes temps réel</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {hotZones.map(({ country, tension, alerts }) => {
          const color = tension ? TENSION_COLOR[tension] : '#FF003C';
          return (
            <button
              key={country.id}
              onClick={() => onSelect(country)}
              className="relative overflow-hidden rounded-2xl border p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: `linear-gradient(135deg, ${color}14 0%, rgba(0,0,0,0.9) 100%)`,
                borderColor: `${color}45`,
                boxShadow: `0 0 30px ${color}10`,
              }}
            >
              <div className="h-0.5 w-full mb-3 rounded-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <div className="flex items-center gap-2.5 mb-2">
                {flagImg(country.countryCode) && (
                  <img src={flagImg(country.countryCode)!} alt="" className="w-8 h-6 rounded object-cover shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">{country.name}</div>
                  {tension && (
                    <div className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color }}>
                      {TENSION_LABEL[tension]}
                    </div>
                  )}
                </div>
              </div>
              {alerts > 0 && (
                <div className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: `${color}99` }}>
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="font-bold">{alerts}</span>
                  <span>alerte{alerts > 1 ? 's' : ''} dans les 24h</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── City Dashboard ────────────────────────────────────────────────────────────

function CityDashboard({ city, country, onBack }: {
  city: CamCity; country: Country; onBack: () => void;
}) {
  const { data: alerts } = useAlerts();
  const { weather, loading: weatherLoading } = useWeather(city.lat, city.lng, true);
  const { time: localTime, date: localDate } = useLocalClock(city.timezone);

  const countryAlerts = (alerts ?? []).filter(a =>
    a.countryCode === country.countryCode &&
    a.timestamp && Date.now() - new Date(a.timestamp).getTime() < 24 * 3600 * 1000
  ).slice(0, 8);

  const embedUrl = getEmbedUrl(city);
  const color = city.tension ? TENSION_COLOR[city.tension] : 'rgba(255,255,255,0.2)';

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour
        </button>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <img src={`https://flagcdn.com/24x18/${country.countryCode.toLowerCase()}.png`} alt="" className="w-6 h-4 rounded-sm" />
          <span className="text-sm font-bold text-white">{city.name}</span>
          <span className="text-[10px] font-mono text-white/30">{country.name}</span>
          {city.tension && <TensionBadge level={city.tension} />}
        </div>
      </div>

      {/* Main layout: Camera + Sidebar */}
      <div className="flex gap-4 flex-col lg:flex-row flex-1 min-h-0">

        {/* Camera — left / main */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {embedUrl ? (
            <div className="relative w-full rounded-2xl overflow-hidden border"
              style={{ paddingBottom: '56.25%', borderColor: `${color}30` }}>
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allowFullScreen
                title={`Caméra ${city.name}`}
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 px-2 py-1 rounded-lg pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[8px] font-bold text-white uppercase tracking-wider">EN DIRECT</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl pointer-events-none flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-white">{city.name}</div>
                  <div className="text-[9px] font-mono text-white/40">{country.name}</div>
                </div>
                {city.tension && <TensionBadge level={city.tension} />}
              </div>
            </div>
          ) : (
            /* No embeddable stream — show placeholder with external links */
            <div className="relative rounded-2xl overflow-hidden border flex flex-col items-center justify-center gap-4 py-16 px-6 text-center"
              style={{ borderColor: `${color}25`, background: `linear-gradient(135deg, ${color}08 0%, rgba(0,0,0,0.9) 100%)` }}>
              <VideoOff className="w-12 h-12" style={{ color: `${color}40` }} />
              <div>
                <div className="text-sm font-bold text-white/60 mb-1">{city.name}</div>
                <div className="text-[10px] font-mono text-white/25 max-w-xs">
                  Les flux caméras de cette ville nécessitent un navigateur externe en raison des restrictions d'intégration.
                </div>
              </div>
              {city.skylineUrl && (
                <a
                  href={city.skylineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-[11px] font-mono transition-all hover:opacity-90"
                  style={{ background: `${color}15`, borderColor: `${color}40`, color }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  OUVRIR LA CAMÉRA EN DIRECT
                </a>
              )}
            </div>
          )}
        </div>

        {/* Sidebar — right */}
        <div className="w-full lg:w-56 shrink-0 flex flex-col gap-3">
          {/* Local time */}
          <div className="rounded-2xl border border-white/8 bg-black/60 p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3 h-3 text-primary/50" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-primary/50">Heure locale</span>
            </div>
            <div className="text-xl font-black font-mono text-primary">{localTime}</div>
            <div className="text-[9px] font-mono text-white/25 mt-0.5 capitalize">{localDate}</div>
          </div>

          {/* Weather */}
          <div className="rounded-2xl border border-white/8 bg-black/60 p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Thermometer className="w-3 h-3 text-primary/50" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-primary/50">Météo</span>
            </div>
            {weatherLoading && <div className="text-[9px] font-mono text-white/20 animate-pulse py-1">Chargement…</div>}
            {weather && (
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">{weather.temp}°C</span>
                  <span className="text-[9px] font-mono text-white/30">ressenti {weather.feelsLike}°</span>
                </div>
                <div className="text-[9px] font-mono text-white/40 leading-snug">{weather.condition}</div>
                <div className="flex items-center gap-1 text-[9px] font-mono text-white/30 mt-1">
                  <Wind className="w-2.5 h-2.5" /><span>{weather.windSpeed} km/h {weather.windDir}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-mono text-white/30">
                  <Eye className="w-2.5 h-2.5" /><span>{weather.visibility} km vis.</span>
                </div>
                <div className="text-[8px] font-mono text-white/20">Humidité {weather.humidity}%</div>
              </div>
            )}
            {!weatherLoading && !weather && (
              <div className="text-[9px] font-mono text-white/20 py-1">Indisponible</div>
            )}
          </div>

          {/* Alerts */}
          <div className="rounded-2xl border border-white/8 bg-black/60 p-3.5 flex-1 min-h-[100px] overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3 h-3 text-destructive/50" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-destructive/50">Alertes 24h</span>
            </div>
            {countryAlerts.length === 0 ? (
              <div className="text-[9px] font-mono text-white/20">Aucune alerte active</div>
            ) : (
              <div className="space-y-2">
                {countryAlerts.map(a => (
                  <div key={a.id} className="text-[9px] font-mono">
                    <span className={`font-bold mr-1 ${a.severity === 'critical' ? 'text-destructive' : a.severity === 'high' ? 'text-amber-400' : 'text-primary/60'}`}>
                      [{a.severity.slice(0, 3).toUpperCase()}]
                    </span>
                    <span className="text-white/50 line-clamp-2">{a.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ISS Detail ────────────────────────────────────────────────────────────────

// ── Shared orbital stat bar ───────────────────────────────────────────────────

function OrbitalStats({ sat, accentColor }: { sat: ISSData; accentColor: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Latitude', value: `${sat.lat.toFixed(3)}°` },
        { label: 'Longitude', value: `${sat.lng.toFixed(3)}°` },
        { label: 'Altitude', value: `${Math.round(sat.altitude)} km` },
        { label: 'Vitesse', value: `${(sat.velocity / 3600).toFixed(2)} km/s` },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-xl border bg-black/60 p-3 text-center"
          style={{ borderColor: `${accentColor}20` }}>
          <div className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: `${accentColor}60` }}>{label}</div>
          <div className="text-sm font-black font-mono" style={{ color: accentColor }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ── ISS Detail ────────────────────────────────────────────────────────────────

function ISSDetail({ onBack }: { onBack?: () => void }) {
  const { data: alerts } = useAlerts();
  const iss = useISSTracker();
  const { images, loading: epicLoading } = useEpicImages();
  const [imgIdx, setImgIdx] = useState(0);

  // Auto-rotate NASA EPIC Earth images
  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setImgIdx(i => (i + 1) % images.length), 7000);
    return () => clearInterval(t);
  }, [images.length]);

  const conflictCities = COUNTRIES
    .filter(c => c.isConflict)
    .flatMap(c => c.cities.map(city => ({ ...city, countryCode: c.countryCode, countryName: c.name })));

  const nearConflicts = iss
    ? conflictCities
      .filter(c => c.tension === 'critical' || c.tension === 'high')
      .map(c => ({ ...c, dist: distanceKm(iss.lat, iss.lng, c.lat, c.lng) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5)
    : [];

  const critAlerts = (alerts ?? []).filter(a =>
    (a.severity === 'critical' || a.severity === 'high') &&
    a.timestamp && Date.now() - new Date(a.timestamp).getTime() < 12 * 3600 * 1000
  ).slice(0, 6);

  const currentImg = images[imgIdx];
  const ACCENT = '#00F0FF';

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        {onBack && (
          <>
            <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour
            </button>
            <div className="w-px h-4 bg-white/10" />
          </>
        )}
        <Satellite className="w-4 h-4 text-primary" style={{ animation: 'spin-slow 6s linear infinite' }} />
        <span className="text-sm font-bold text-white">Station Spatiale Internationale · ISS</span>
        <span className="text-[7px] font-black px-1.5 py-0.5 rounded border border-primary/30 text-primary bg-primary/10">LIVE</span>
      </div>

      {/* Main layout */}
      <div className="flex gap-4 flex-col lg:flex-row flex-1 min-h-0">

        {/* Left: Earth imagery + stats */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* NASA EPIC Earth imagery hero */}
          <div className="relative w-full rounded-2xl overflow-hidden border"
            style={{ paddingBottom: '56.25%', borderColor: `${ACCENT}25`, background: 'rgba(0,0,0,0.8)' }}>

            {/* Image */}
            {currentImg && (
              <img
                key={currentImg.image}
                src={epicUrl(currentImg)}
                alt="Terre depuis l'espace — NASA EPIC"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                style={{ opacity: 1 }}
              />
            )}

            {/* Loading placeholder */}
            {(epicLoading || images.length === 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ background: 'radial-gradient(ellipse at center, #001a2e 0%, #000 100%)' }}>
                <div className="w-16 h-16 rounded-full border-2 border-primary/30 animate-pulse"
                  style={{ background: 'radial-gradient(ellipse, #002d4a 0%, #000820 100%)' }} />
                <span className="text-[9px] font-mono text-white/30 animate-pulse">
                  {epicLoading ? 'Chargement imagerie NASA…' : 'Imagerie indisponible'}
                </span>
              </div>
            )}

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)' }} />

            {/* LIVE badge top-left */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm px-2 py-1 rounded-lg pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[8px] font-bold text-white uppercase tracking-wider">EN DIRECT</span>
            </div>

            {/* Image counter top-right */}
            {images.length > 1 && (
              <div className="absolute top-3 right-3 flex items-center gap-1 pointer-events-none">
                {images.map((_, i) => (
                  <span key={i} className="w-1 h-1 rounded-full transition-all"
                    style={{ background: i === imgIdx ? ACCENT : 'rgba(255,255,255,0.3)' }} />
                ))}
              </div>
            )}

            {/* Bottom overlay: position + NASA TV link */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl">
                <div className="text-[10px] font-bold text-white mb-0.5">Terre vue de l'espace · NASA EPIC</div>
                {iss ? (
                  <div className="text-[8px] font-mono" style={{ color: `${ACCENT}99` }}>
                    ISS {iss.lat >= 0 ? 'N' : 'S'}{Math.abs(iss.lat).toFixed(1)}° {iss.lng >= 0 ? 'E' : 'O'}{Math.abs(iss.lng).toFixed(1)}° · {Math.round(iss.altitude)} km
                  </div>
                ) : (
                  <div className="text-[8px] font-mono text-white/30 animate-pulse">Localisation ISS…</div>
                )}
                {currentImg && (
                  <div className="text-[7px] font-mono text-white/25 mt-0.5">
                    Photo : {new Date(currentImg.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 pointer-events-auto">
                <a
                  href="https://www.youtube.com/watch?v=P57pHPzj4qU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 backdrop-blur-md px-3 py-2 rounded-xl text-[9px] font-bold font-mono transition-all hover:opacity-90"
                  style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`, color: ACCENT }}
                >
                  <ExternalLink className="w-3 h-3" />
                  REGARDER NASA TV ↗
                </a>
              </div>
            </div>
          </div>

          {/* Orbital telemetry */}
          {iss ? (
            <OrbitalStats sat={iss} accentColor={ACCENT} />
          ) : (
            <div className="flex items-center justify-center py-6 gap-2 text-[10px] font-mono text-white/25">
              <Satellite className="w-4 h-4 animate-pulse" />
              Connexion ISS en cours…
            </div>
          )}

          {/* Crew + orbit info strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Équipage', value: '7 pers.', sub: 'à bord actuellement' },
              { label: 'Période orbitale', value: '~92 min', sub: 'tour de la Terre' },
              { label: 'Visibilité', value: iss?.visibility === 'daylight' ? 'Jour' : iss?.visibility === 'eclipsed' ? 'Ombre' : '—', sub: 'côté illuminé' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-xl border border-white/8 bg-black/60 p-3 text-center">
                <div className="text-[7px] font-bold uppercase tracking-widest text-white/25 mb-1">{label}</div>
                <div className="text-sm font-black font-mono text-white/80">{value}</div>
                <div className="text-[7px] font-mono text-white/20 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-56 shrink-0 flex flex-col gap-3">
          {/* Nearby conflict zones */}
          {nearConflicts.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-black/60 p-3.5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <MapPin className="w-3 h-3 text-destructive/50" />
                <span className="text-[8px] font-bold uppercase tracking-widest text-destructive/50">Zones de conflit proches</span>
              </div>
              <div className="space-y-2">
                {nearConflicts.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-[9px] font-mono">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img src={`https://flagcdn.com/16x12/${c.countryCode.toLowerCase()}.png`} alt="" className="w-4 h-3 rounded-sm shrink-0" />
                      <span className="text-white/50 truncate">{c.name}</span>
                    </div>
                    <span className="text-primary/60 font-bold shrink-0 ml-1">{c.dist.toLocaleString('fr-FR')} km</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent critical alerts */}
          <div className="rounded-2xl border border-white/8 bg-black/60 p-3.5 flex-1 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Zap className="w-3 h-3 text-amber-400/50" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-amber-400/50">Alertes crit/élevées · 12h</span>
            </div>
            {critAlerts.length === 0 ? (
              <div className="text-[9px] font-mono text-white/20">Aucune alerte récente</div>
            ) : (
              <div className="space-y-2">
                {critAlerts.map(a => (
                  <div key={a.id} className="text-[9px] font-mono">
                    <span className={`font-bold mr-1 ${a.severity === 'critical' ? 'text-destructive' : 'text-amber-400'}`}>
                      {a.country}
                    </span>
                    <span className="text-white/40 line-clamp-2">{a.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NASA links */}
          <div className="rounded-2xl border border-white/8 bg-black/60 p-3.5 space-y-2">
            <div className="text-[8px] font-bold uppercase tracking-widest text-white/25 mb-2">Sources officielles</div>
            {[
              { label: 'NASA TV Live', url: 'https://www.nasa.gov/nasatv/' },
              { label: 'Tracker ISS (NASA)', url: 'https://spotthestation.nasa.gov/tracking_map.cfm' },
              { label: 'Photos EPIC NASA', url: 'https://epic.gsfc.nasa.gov' },
            ].map(({ label, url }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[9px] font-mono text-primary/50 hover:text-primary transition-colors">
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tiangong Detail ────────────────────────────────────────────────────────────

function TiangongDetail({ onBack }: { onBack?: () => void }) {
  const { data: alerts } = useAlerts();
  const sat = useTiangongTracker();
  const ACCENT = '#FF4500';

  const critAlerts = (alerts ?? []).filter(a =>
    (a.severity === 'critical' || a.severity === 'high') &&
    a.timestamp && Date.now() - new Date(a.timestamp).getTime() < 12 * 3600 * 1000
  ).slice(0, 6);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        {onBack && (
          <>
            <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour
            </button>
            <div className="w-px h-4 bg-white/10" />
          </>
        )}
        <img src="https://flagcdn.com/24x18/cn.png" alt="CN" className="w-6 h-4 rounded-sm" />
        <span className="text-sm font-bold text-white">Station Spatiale Tiangong · CSS</span>
        <span className="text-[7px] font-black px-1.5 py-0.5 rounded border" style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}15` }}>LIVE</span>
      </div>

      {/* Main layout */}
      <div className="flex gap-4 flex-col lg:flex-row flex-1 min-h-0">

        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Hero panel */}
          <div className="relative w-full rounded-2xl overflow-hidden border flex flex-col items-center justify-center py-14 px-6"
            style={{
              borderColor: `${ACCENT}30`,
              background: `radial-gradient(ellipse at 40% 40%, ${ACCENT}12 0%, rgba(0,0,0,0.95) 70%)`,
              minHeight: '240px',
            }}>
            {/* Animated rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 rounded-full border animate-ping"
                style={{ borderColor: `${ACCENT}10`, animationDuration: '3s' }} />
              <div className="absolute w-48 h-48 rounded-full border"
                style={{ borderColor: `${ACCENT}15`, animation: 'spin-slow 20s linear infinite' }} />
              <div className="absolute w-80 h-80 rounded-full border"
                style={{ borderColor: `${ACCENT}08`, animation: 'spin-slow 35s linear infinite reverse' }} />
            </div>

            {/* Station icon */}
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div className="flex items-center gap-3">
                <Satellite className="w-10 h-10" style={{ color: ACCENT, animation: 'spin-slow 10s linear infinite' }} />
              </div>
              <div>
                <div className="text-2xl font-black text-white mb-1">天宫 Tiangong</div>
                <div className="text-[11px] font-mono text-white/40">Station Spatiale Chinoise (CSS) · NORAD 48274</div>
              </div>

              {sat ? (
                <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: ACCENT }}>
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ background: ACCENT }} />
                  Survol : {sat.lat >= 0 ? 'N' : 'S'}{Math.abs(sat.lat).toFixed(1)}° {sat.lng >= 0 ? 'E' : 'O'}{Math.abs(sat.lng).toFixed(1)}° · {Math.round(sat.altitude)} km
                </div>
              ) : (
                <div className="text-[9px] font-mono text-white/30 animate-pulse">Connexion Tiangong en cours…</div>
              )}

              <div className="flex gap-2 mt-2">
                <a href="https://heavens-above.com/satinfo.aspx?satid=48274"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold font-mono transition-all hover:opacity-90"
                  style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}45`, color: ACCENT }}>
                  <ExternalLink className="w-3 h-3" />
                  SUIVRE SUR HEAVENS-ABOVE ↗
                </a>
                <a href="https://www.n2yo.com/satellite/?s=48274"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold font-mono transition-all hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                  <ExternalLink className="w-3 h-3" />
                  N2YO TRACKER ↗
                </a>
              </div>
            </div>
          </div>

          {/* Telemetry */}
          {sat && <OrbitalStats sat={sat} accentColor={ACCENT} />}

          {/* Station modules info */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Tianhe', icon: '🛸', desc: 'Module central de vie', year: '2021' },
              { name: 'Wentian', icon: '🔬', desc: 'Laboratoire scientifique', year: '2022' },
              { name: 'Mengtian', icon: '⚗️', desc: 'Module expérimental', year: '2022' },
            ].map(m => (
              <div key={m.name} className="rounded-xl border border-white/8 bg-black/60 p-3 text-center">
                <div className="text-lg mb-1">{m.icon}</div>
                <div className="text-[11px] font-bold text-white">{m.name}</div>
                <div className="text-[8px] font-mono text-white/30 mt-0.5 leading-snug">{m.desc}</div>
                <div className="text-[7px] font-mono mt-1" style={{ color: `${ACCENT}70` }}>Lancé {m.year}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-56 shrink-0 flex flex-col gap-3">

          {/* Station facts */}
          <div className="rounded-2xl border border-white/8 bg-black/60 p-3.5 space-y-2.5">
            <div className="text-[8px] font-bold uppercase tracking-widest text-white/25 mb-2">Caractéristiques</div>
            {[
              { label: 'Équipage', value: '3 taikonautes' },
              { label: 'Orbite', value: '340 – 450 km' },
              { label: 'Période', value: '~91 min / orbite' },
              { label: 'Inclinaison', value: '41.5°' },
              { label: 'Opérateur', value: 'CNSA / CMS' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-white/30">{label}</span>
                <span className="text-white/70 font-bold">{value}</span>
              </div>
            ))}
          </div>

          {/* Critical alerts */}
          <div className="rounded-2xl border border-white/8 bg-black/60 p-3.5 flex-1 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Zap className="w-3 h-3 text-amber-400/50" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-amber-400/50">Alertes mondiales · 12h</span>
            </div>
            {critAlerts.length === 0 ? (
              <div className="text-[9px] font-mono text-white/20">Aucune alerte récente</div>
            ) : (
              <div className="space-y-2">
                {critAlerts.map(a => (
                  <div key={a.id} className="text-[9px] font-mono">
                    <span className={`font-bold mr-1 ${a.severity === 'critical' ? 'text-destructive' : 'text-amber-400'}`}>{a.country}</span>
                    <span className="text-white/40 line-clamp-2">{a.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="rounded-2xl border border-white/8 bg-black/60 p-3.5 space-y-2">
            <div className="text-[8px] font-bold uppercase tracking-widest text-white/25 mb-2">Sources</div>
            {[
              { label: 'CNSA officiel', url: 'http://www.cnsa.gov.cn' },
              { label: 'Heavens-Above', url: 'https://heavens-above.com/satinfo.aspx?satid=48274' },
              { label: 'CelesTrak TLE', url: 'https://celestrak.org/SOCRATES/query.php?IDENT=4&NAME1=TIANGONG&NAME2=ISS' },
            ].map(({ label, url }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[9px] font-mono hover:text-white transition-colors"
                style={{ color: `${ACCENT}70` }}>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Launches View ─────────────────────────────────────────────────────────────

function CountdownBadge({ net, color }: { net: string; color: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const { label, ms } = formatCountdown(net);
  const isUrgent = ms > 0 && ms < 3600000;
  return (
    <span
      className="text-[11px] font-black font-mono px-2 py-0.5 rounded"
      style={{
        color: ms <= 0 ? 'rgba(255,255,255,0.3)' : isUrgent ? '#FF4500' : color,
        background: ms <= 0 ? 'rgba(255,255,255,0.05)' : isUrgent ? 'rgba(255,69,0,0.1)' : `${color}15`,
        border: `1px solid ${ms <= 0 ? 'rgba(255,255,255,0.08)' : isUrgent ? 'rgba(255,69,0,0.4)' : `${color}30`}`,
        animation: isUrgent ? 'pulse 1s ease-in-out infinite' : undefined,
      }}
    >
      {label}
    </span>
  );
}

function LaunchCard({ launch, featured }: { launch: Launch; featured?: boolean }) {
  const agency = launch.launch_service_provider?.name ?? 'Inconnu';
  const aColor = agencyColor(agency);
  const statusAbbrev = launch.status?.abbrev ?? 'TBD';
  const statusColor = STATUS_COLOR[statusAbbrev] ?? '#64748b';
  const ytId = extractYouTubeId(launch.links?.webcast);
  const isLive = launch.links?.webcast_live;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: featured
          ? `linear-gradient(135deg, ${aColor}18 0%, rgba(0,0,0,0.92) 100%)`
          : 'rgba(255,255,255,0.02)',
        borderColor: featured ? `${aColor}45` : 'rgba(255,255,255,0.08)',
        boxShadow: featured ? `0 0 20px ${aColor}10` : 'none',
      }}
    >
      {/* Agency color bar */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${aColor}, transparent)` }} />

      <div className="p-3.5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{ color: aColor, background: `${aColor}20`, border: `1px solid ${aColor}30` }}>
                {agency.length > 20 ? agency.split(' ').map((w: string) => w[0]).join('') : agency}
              </span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
                {launch.status?.name ?? 'TBD'}
              </span>
              {isLive && (
                <span className="flex items-center gap-1 text-[8px] font-black text-red-400 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-red-400 animate-ping" />
                  LIVE
                </span>
              )}
            </div>
            <div className="text-[12px] font-bold text-white leading-tight line-clamp-2">
              {launch.mission?.name ?? launch.name}
            </div>
            {launch.mission?.name && launch.mission.name !== launch.name && (
              <div className="text-[9px] font-mono text-white/30 mt-0.5">{launch.name}</div>
            )}
          </div>
          <CountdownBadge net={launch.net} color={aColor} />
        </div>

        {/* Details row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] font-mono text-white/35">
          {launch.rocket?.configuration?.name && (
            <span className="flex items-center gap-1">
              <Rocket className="w-2.5 h-2.5" />
              {launch.rocket.configuration.name}
            </span>
          )}
          {launch.pad?.location?.name && (
            <span className="flex items-center gap-1">
              <Globe2 className="w-2.5 h-2.5" />
              {launch.pad.location.name.split(',')[0]}
            </span>
          )}
          {launch.mission?.orbit?.name && (
            <span className="flex items-center gap-1">
              <Satellite className="w-2.5 h-2.5" />
              {launch.mission.orbit.name}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="w-2.5 h-2.5" />
            {new Date(launch.net).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Mission description */}
        {featured && launch.mission?.description && (
          <div className="text-[9px] font-mono text-white/25 mt-2 leading-relaxed line-clamp-2">
            {launch.mission.description}
          </div>
        )}

        {/* Webcast button or embed */}
        {isLive && ytId ? (
          <div className="mt-3 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%', position: 'relative' }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen"
              title={launch.name}
            />
          </div>
        ) : launch.links?.webcast ? (
          <a
            href={launch.links.webcast}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 flex items-center gap-1.5 text-[9px] font-bold font-mono px-3 py-1.5 rounded-lg transition-all hover:opacity-90 w-fit"
            style={{ background: `${aColor}15`, border: `1px solid ${aColor}35`, color: aColor }}
          >
            <Play className="w-3 h-3" />
            {isLive ? 'REGARDER LE DIRECT ↗' : 'VOIR LE WEBCAST ↗'}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function LaunchesView() {
  const { upcoming, previous, loading, lastRefresh, refresh } = useLaunches();
  const [refreshing, setRefreshing] = useState(false);

  const liveLaunches = upcoming.filter(l => l.links?.webcast_live);
  const upcomingFiltered = upcoming.filter(l => !l.links?.webcast_live);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Toutes agences · Launch Library 2</div>
          <div className="text-lg font-black text-white">Calendrier des Lancements</div>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <div className="text-[8px] font-mono text-white/20">
              Mis à jour {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-[9px] font-mono px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-[10px] font-mono text-white/30">
          <Rocket className="w-5 h-5 animate-bounce" />
          <span className="animate-pulse">Récupération des données Launch Library…</span>
        </div>
      )}

      {/* Live launches - hero */}
      {!loading && liveLaunches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Lancement en cours</span>
          </div>
          <div className="space-y-3">
            {liveLaunches.map(l => <LaunchCard key={l.id} launch={l} featured />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {!loading && upcomingFiltered.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-0.5 h-4 rounded-full bg-primary/70" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Prochains lancements</span>
            <span className="text-[8px] font-mono text-white/20">{upcomingFiltered.length} confirmés</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {upcomingFiltered.slice(0, 12).map((l, i) => (
              <LaunchCard key={l.id} launch={l} featured={i < 2} />
            ))}
          </div>
        </div>
      )}

      {/* Recent past */}
      {!loading && previous.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-0.5 h-4 rounded-full bg-white/20" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Lancements récents</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {previous.slice(0, 8).map(l => <LaunchCard key={l.id} launch={l} />)}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && upcoming.length === 0 && previous.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Rocket className="w-10 h-10 text-white/10" />
          <div className="text-[11px] font-mono text-white/20">
            Données indisponibles — vérifiez votre connexion
          </div>
          <button onClick={handleRefresh} className="text-[9px] font-mono text-primary/50 hover:text-primary transition-colors">
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

const SPACE_TABS: { id: SpaceTab; label: string; icon: string; color: string }[] = [
  { id: 'iss',      label: 'ISS',        icon: '🛸', color: '#00F0FF' },
  { id: 'tiangong', label: 'TIANGONG',   icon: '🔴', color: '#FF4500' },
  { id: 'launches', label: 'LANCEMENTS', icon: '🚀', color: '#FFB800' },
];

export default function LiveView() {
  const [tab, setTab] = useState<SpaceTab>('iss');

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-black text-white overflow-hidden">

        {/* Tab bar */}
        <div className="shrink-0 flex items-center gap-1 px-4 py-2.5 border-b"
          style={{ borderBottomColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.6)' }}>
          <div className="flex items-center gap-1 mr-3">
            <Satellite className="w-3 h-3 text-white/20" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20">ESPACE</span>
          </div>
          {SPACE_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
              style={tab === t.id
                ? { background: `${t.color}12`, border: `1px solid ${t.color}35`, color: t.color }
                : { border: '1px solid transparent', color: 'rgba(255,255,255,0.3)' }
              }
              data-testid={`tab-${t.id}`}
            >
              <span className="text-[10px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {tab === 'iss'      && <ISSDetail />}
          {tab === 'tiangong' && <TiangongDetail />}
          {tab === 'launches' && <LaunchesView />}
        </div>

      </div>
    </AppLayout>
  );
}
