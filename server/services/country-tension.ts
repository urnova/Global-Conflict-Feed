/**
 * Country Tension Service — Argos V7
 * AI-powered classification via Groq (hourly cache).
 * Falls back to algorithmic scoring if Groq is unavailable.
 */

import { storage } from '../storage.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type TensionStatus = 'war' | 'high' | 'tension' | 'sanctions' | 'watchlist' | 'stable';

export interface CountryTensionEntry {
    code: string;
    name: string;
    status: TensionStatus;
    score: number;
    activeAlerts: number;
    reason: string;
    flag?: string;
}

// ── In-memory cache (1 hour) ────────────────────────────────────────────────
let tensionCache: { data: CountryTensionEntry[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ── Static baseline data ────────────────────────────────────────────────────
const STATIC_TENSIONS: Record<string, { reason: string; name: string; flag: string; baseScore: number }> = {
    UA: { baseScore: 30, name: 'Ukraine',          reason: 'Guerre russo-ukrainienne en cours',          flag: '🇺🇦' },
    RU: { baseScore: 28, name: 'Russie',            reason: 'Invasion de l\'Ukraine, sanctions OTAN',     flag: '🇷🇺' },
    PS: { baseScore: 30, name: 'Palestine (Gaza)',  reason: 'Conflit Gaza — opération IDF',               flag: '🇵🇸' },
    IL: { baseScore: 26, name: 'Israël',            reason: 'Guerre à Gaza, tensions Hezbollah',          flag: '🇮🇱' },
    SD: { baseScore: 28, name: 'Soudan',            reason: 'Guerre civile SAF vs RSF',                   flag: '🇸🇩' },
    YE: { baseScore: 26, name: 'Yémen',             reason: 'Conflit Houthis — coalition saoudienne',     flag: '🇾🇪' },
    MM: { baseScore: 25, name: 'Myanmar',           reason: 'Guerre civile post-coup d\'État',            flag: '🇲🇲' },
    SS: { baseScore: 24, name: 'Soudan du Sud',     reason: 'Conflits armés récurrents',                  flag: '🇸🇸' },
    SO: { baseScore: 23, name: 'Somalie',           reason: 'Al-Shabaab — AMISOM',                        flag: '🇸🇴' },
    AF: { baseScore: 23, name: 'Afghanistan',       reason: 'Talibans — résistance armée',                flag: '🇦🇫' },
    SY: { baseScore: 22, name: 'Syrie',             reason: 'Conflit en cours — post-Assad',              flag: '🇸🇾' },
    CD: { baseScore: 22, name: 'RD Congo',          reason: 'M23, Rwanda, conflit Est-Congo',             flag: '🇨🇩' },
    KP: { baseScore: 20, name: 'Corée du Nord',     reason: 'Essais missiles ICBM, troupes en Russie',   flag: '🇰🇵' },
    IR: { baseScore: 20, name: 'Iran',              reason: 'Programme nucléaire, tensions régionales',   flag: '🇮🇷' },
    IQ: { baseScore: 18, name: 'Irak',              reason: 'Milices pro-iraniennes actives',             flag: '🇮🇶' },
    LY: { baseScore: 18, name: 'Libye',             reason: 'Conflit de basse intensité — Est/Ouest',    flag: '🇱🇾' },
    ML: { baseScore: 18, name: 'Mali',              reason: 'Sahel, groupes armés, djihadisme',           flag: '🇲🇱' },
    CF: { baseScore: 18, name: 'Centrafrique',      reason: 'Groupes armés, instabilité',                flag: '🇨🇫' },
    NG: { baseScore: 16, name: 'Nigéria',           reason: 'Boko Haram, ISWAP, nord-est',               flag: '🇳🇬' },
    ET: { baseScore: 16, name: 'Éthiopie',          reason: 'Conflit Amhara, Oromo, séquelles Tigray',   flag: '🇪🇹' },
    PK: { baseScore: 15, name: 'Pakistan',          reason: 'TTP, tensions Afghanistan-Inde',            flag: '🇵🇰' },
    HT: { baseScore: 15, name: 'Haïti',             reason: 'Gangs, effondrement de l\'État',            flag: '🇭🇹' },
    TW: { baseScore: 14, name: 'Taïwan',            reason: 'Pression militaire chinoise croissante',    flag: '🇹🇼' },
    CN: { baseScore: 12, name: 'Chine',             reason: 'Détroit de Taïwan, Mer de Chine Sud',       flag: '🇨🇳' },
    LB: { baseScore: 12, name: 'Liban',             reason: 'Post-conflit Hezbollah, reconstruction',   flag: '🇱🇧' },
    AZ: { baseScore: 10, name: 'Azerbaïdjan',       reason: 'Post-Karabakh, tensions Arménie',           flag: '🇦🇿' },
    AM: { baseScore: 10, name: 'Arménie',           reason: 'Pertes Karabakh, pression azerbaïdjane',    flag: '🇦🇲' },
    MZ: { baseScore: 10, name: 'Mozambique',        reason: 'Insurgés jihadistes Cabo Delgado',          flag: '🇲🇿' },
    VE: { baseScore: 8,  name: 'Venezuela',         reason: 'Tensions frontalières Guyana/Colombie',     flag: '🇻🇪' },
    BY: { baseScore: 7,  name: 'Biélorussie',       reason: 'Sanctions UE/US, régime Loukachenko',       flag: '🇧🇾' },
    CU: { baseScore: 5,  name: 'Cuba',              reason: 'Embargo américain, sanctions',              flag: '🇨🇺' },
    VN: { baseScore: 5,  name: 'Vietnam',           reason: 'Disputes Mer de Chine Sud',                 flag: '🇻🇳' },
    PH: { baseScore: 5,  name: 'Philippines',       reason: 'Incidents Mer de Chine Sud — Chine',        flag: '🇵🇭' },
    RS: { baseScore: 6,  name: 'Serbie',            reason: 'Tensions Kosovo-Serbie',                    flag: '🇷🇸' },
    GE: { baseScore: 5,  name: 'Géorgie',           reason: 'Régions occupées, tensions pro-EU',         flag: '🇬🇪' },
};

const SEVERITY_WEIGHTS: Record<string, number> = {
    critical: 25, high: 12, medium: 5, low: 2,
};

function scoreToStatus(score: number): TensionStatus {
    if (score >= 70) return 'war';
    if (score >= 50) return 'high';
    if (score >= 30) return 'tension';
    if (score >= 15) return 'watchlist';
    if (score >= 8)  return 'sanctions';
    return 'stable';
}

// ── AI classification via Groq ───────────────────────────────────────────────
async function classifyWithGroq(apiKey: string): Promise<CountryTensionEntry[] | null> {
    const allAlerts = await storage.getAlerts();
    const now = Date.now();
    const H48 = 48 * 60 * 60 * 1000;
    const recent = allAlerts
        .filter(a => !a.timestamp || now - new Date(a.timestamp).getTime() < H48)
        .slice(0, 80);

    if (recent.length === 0) return null;

    // Count active alerts per country
    const alertCounts: Record<string, number> = {};
    for (const a of recent) {
        if (a.countryCode) alertCounts[a.countryCode] = (alertCounts[a.countryCode] ?? 0) + 1;
    }

    const digest = recent
        .slice(0, 50)
        .map(a => `[${a.severity?.toUpperCase()}][${a.type}][${a.countryCode ?? '?'}] ${a.aiLabel ?? a.title}`)
        .join('\n');

    const staticList = Object.entries(STATIC_TENSIONS)
        .map(([code, d]) => `${code}: ${d.name} (baseline: ${d.baseScore})`)
        .join(', ');

    const prompt = `Tu es un analyste de renseignement géopolitique pour le système ARGOS.

Données d'alertes mondiales des dernières 48h (${recent.length} événements):
${digest}

Pays avec données géopolitiques statiques: ${staticList}

Classifie chaque pays actif par niveau de tension. Statuts:
- "war" = guerre active ouverte (score 70-100)
- "high" = conflit armé/tension critique (score 50-70)
- "tension" = tension notable/incidents (score 30-50)
- "sanctions" = pression économique/diplomatique (score 15-30)
- "watchlist" = à surveiller, risque faible (score 8-15)
- "stable" = stable (score < 8)

Réponds UNIQUEMENT avec du JSON valide. Format exact:
[{"code":"XX","name":"Nom du pays","status":"war","score":85,"reason":"Raison courte en français (max 60 chars)","activeAlerts":3}]

Inclure TOUS les pays avec score > 5 (max 35 pays). Pas d'explication, uniquement le JSON.`;

    const resp = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 2000,
        }),
    });

    if (!resp.ok) {
        console.error('[tension] Groq API error:', resp.status, await resp.text());
        return null;
    }

    const json = await resp.json();
    const raw = json.choices?.[0]?.message?.content ?? '';

    // Extract JSON array from response
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
        console.error('[tension] No JSON array in Groq response');
        return null;
    }

    const parsed: Array<{
        code: string; name: string; status: TensionStatus;
        score: number; reason: string; activeAlerts?: number;
    }> = JSON.parse(match[0]);

    return parsed.map(entry => {
        const staticData = STATIC_TENSIONS[entry.code];
        return {
            code: entry.code,
            name: entry.name || staticData?.name || entry.code,
            status: entry.status,
            score: Math.min(100, Math.max(0, entry.score)),
            activeAlerts: entry.activeAlerts ?? alertCounts[entry.code] ?? 0,
            reason: entry.reason,
            flag: staticData?.flag ?? '🌍',
        };
    }).sort((a, b) => b.score - a.score);
}

// ── Algorithmic fallback ─────────────────────────────────────────────────────
async function computeAlgorithmic(): Promise<CountryTensionEntry[]> {
    const allAlerts = await storage.getAlerts();
    const now = Date.now();
    const cutoff7d  = now - 7  * 24 * 60 * 60 * 1000;
    const cutoff30d = now - 30 * 24 * 60 * 60 * 1000;

    const recentAlerts = allAlerts.filter(a => {
        const isUcdp = typeof (a as any).source === 'string' && (a as any).source.startsWith('UCDP');
        const dateMs = isUcdp && (a as any).eventStart
            ? new Date((a as any).eventStart).getTime()
            : a.timestamp ? new Date(a.timestamp).getTime() : 0;
        return dateMs > (isUcdp ? cutoff30d : cutoff7d);
    });

    const countryAlertMap: Record<string, { count: number; boost: number }> = {};
    for (const a of recentAlerts) {
        if (!a.countryCode) continue;
        if (!countryAlertMap[a.countryCode]) countryAlertMap[a.countryCode] = { count: 0, boost: 0 };
        countryAlertMap[a.countryCode].count++;
        const isUcdp = typeof (a as any).source === 'string' && (a as any).source.startsWith('UCDP');
        const boost = isUcdp && typeof (a as any).severityScore === 'number'
            ? (a as any).severityScore * 3
            : SEVERITY_WEIGHTS[a.severity] ?? 1;
        countryAlertMap[a.countryCode].boost += boost;
    }

    const results: CountryTensionEntry[] = [];

    for (const [code, staticData] of Object.entries(STATIC_TENSIONS)) {
        const dynamic = countryAlertMap[code] || { count: 0, boost: 0 };
        const score = Math.min(100, staticData.baseScore + Math.min(dynamic.boost, 75));
        if (dynamic.count === 0 && staticData.baseScore < 5) continue;
        results.push({
            code, name: staticData.name, status: scoreToStatus(score),
            score, activeAlerts: dynamic.count,
            reason: staticData.reason, flag: staticData.flag,
        });
    }

    for (const [code, dynamic] of Object.entries(countryAlertMap)) {
        if (STATIC_TENSIONS[code]) continue;
        const alertForCountry = recentAlerts.find(a => a.countryCode === code);
        const countryName = (alertForCountry as any)?.country || code;
        const score = Math.min(100, dynamic.boost);
        results.push({
            code, name: countryName, status: scoreToStatus(score),
            score, activeAlerts: dynamic.count,
            reason: `${dynamic.count} incident(s) détecté(s)`,
            flag: '🌍',
        });
    }

    return results.sort((a, b) => b.score - a.score);
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function getCountryTension(): Promise<CountryTensionEntry[]> {
    // Return cached result if fresh
    if (tensionCache && Date.now() - tensionCache.timestamp < CACHE_TTL) {
        return tensionCache.data;
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (GROQ_API_KEY) {
        try {
            console.log('[tension] Running AI classification via Groq…');
            const aiResult = await classifyWithGroq(GROQ_API_KEY);
            if (aiResult && aiResult.length > 0) {
                console.log(`[tension] AI classified ${aiResult.length} countries`);
                tensionCache = { data: aiResult, timestamp: Date.now() };
                return aiResult;
            }
        } catch (err) {
            console.error('[tension] AI classification failed, using algorithmic fallback:', err);
        }
    }

    const result = await computeAlgorithmic();
    tensionCache = { data: result, timestamp: Date.now() };
    return result;
}

/** Force-clear the cache (e.g. on briefing refresh) */
export function invalidateTensionCache() {
    tensionCache = null;
}
