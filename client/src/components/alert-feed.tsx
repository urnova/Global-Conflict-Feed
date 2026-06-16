import { useAlerts } from "@/hooks/use-alerts";
import { useAlertWebSocket } from "@/hooks/use-websocket";
import {
  Navigation2, Zap, FlameKindling, Anchor, Crosshair, Shield, Cpu,
  Skull, Flame, Gavel, Ban, Megaphone, Radio, AlertTriangle, Search,
  Waves, Mountain, Droplets, Wind, Tornado, CloudLightning, ThermometerSun,
  Biohazard, HeartPulse, Globe2, SlidersHorizontal, Activity, ArrowUpDown,
  Clock, TrendingUp
} from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { parseSourceBadge } from "@/lib/source-badge";
import type { Alert } from "@shared/schema";

// ── Flag ────────────────────────────────────────────────────────────────────
function FlagImg({ code }: { code?: string | null }) {
  if (!code || code.length !== 2) return <Globe2 className="w-3 h-3 text-white/20" />;
  return (
    <img
      src={`https://flagcdn.com/20x15/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/40x30/${code.toLowerCase()}.png 2x`}
      width="20" height="15" alt={code}
      className="rounded-sm shrink-0 opacity-80"
    />
  );
}

// ── Type metadata ────────────────────────────────────────────────────────────
const TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string; cat: string }> = {
  missile:        { icon: <Navigation2 className="w-3 h-3 rotate-45" />, label: "MISSILE",      color: "#F02D3A", cat: "MIL" },
  airstrike:      { icon: <Zap className="w-3 h-3" />,                   label: "FRAPPE AÉRO",  color: "#EF4444", cat: "MIL" },
  artillery:      { icon: <FlameKindling className="w-3 h-3" />,         label: "ARTILLERIE",   color: "#F97316", cat: "MIL" },
  naval:          { icon: <Anchor className="w-3 h-3" />,                label: "NAVAL",        color: "#3B82F6", cat: "MIL" },
  conflict:       { icon: <Crosshair className="w-3 h-3" />,             label: "COMBAT",       color: "#F97316", cat: "MIL" },
  explosion:      { icon: <Shield className="w-3 h-3" />,               label: "EXPLOSION",    color: "#EF4444", cat: "MIL" },
  chemical:       { icon: <Biohazard className="w-3 h-3" />,            label: "CHIMIQUE",     color: "#84CC16", cat: "MIL" },
  nuclear:        { icon: <Activity className="w-3 h-3" />,             label: "NUCLÉAIRE",    color: "#D946EF", cat: "MIL" },
  cyber:          { icon: <Cpu className="w-3 h-3" />,                  label: "CYBER",        color: "#00C8D4", cat: "MIL" },
  massacre:       { icon: <Skull className="w-3 h-3" />,                label: "MASSACRE",     color: "#DC2626", cat: "MIL" },
  terrorism:      { icon: <Flame className="w-3 h-3" />,                label: "TERRORISME",   color: "#F02D3A", cat: "MIL" },
  coup:           { icon: <Gavel className="w-3 h-3" />,                label: "COUP D'ÉTAT",  color: "#A855F7", cat: "POL" },
  earthquake:     { icon: <Activity className="w-3 h-3" />,             label: "SÉISME",       color: "#F97316", cat: "NAT" },
  tsunami:        { icon: <Waves className="w-3 h-3" />,                label: "TSUNAMI",      color: "#60A5FA", cat: "NAT" },
  volcano:        { icon: <Mountain className="w-3 h-3" />,             label: "VOLCAN",       color: "#EF4444", cat: "NAT" },
  flood:          { icon: <Droplets className="w-3 h-3" />,             label: "INONDATION",   color: "#3B82F6", cat: "NAT" },
  wildfire:       { icon: <Flame className="w-3 h-3" />,                label: "INCENDIE",     color: "#F97316", cat: "NAT" },
  avalanche:      { icon: <Mountain className="w-3 h-3" />,             label: "AVALANCHE",    color: "#BAE6FD", cat: "NAT" },
  landslide:      { icon: <Mountain className="w-3 h-3" />,             label: "GLISSEMENT",   color: "#92400E", cat: "NAT" },
  hurricane:      { icon: <Wind className="w-3 h-3" />,                 label: "OURAGAN",      color: "#60A5FA", cat: "MET" },
  cyclone:        { icon: <Wind className="w-3 h-3" />,                 label: "CYCLONE",      color: "#60A5FA", cat: "MET" },
  tornado:        { icon: <Tornado className="w-3 h-3" />,              label: "TORNADE",      color: "#818CF8", cat: "MET" },
  storm:          { icon: <CloudLightning className="w-3 h-3" />,       label: "TEMPÊTE",      color: "#818CF8", cat: "MET" },
  heatwave:       { icon: <ThermometerSun className="w-3 h-3" />,       label: "CANICULE",     color: "#F59E0B", cat: "MET" },
  "cold-snap":    { icon: <Wind className="w-3 h-3" />,                 label: "GRAND FROID",  color: "#BAE6FD", cat: "MET" },
  drought:        { icon: <ThermometerSun className="w-3 h-3" />,       label: "SÉCHERESSE",   color: "#B45309", cat: "MET" },
  pandemic:       { icon: <Biohazard className="w-3 h-3" />,            label: "PANDÉMIE",     color: "#10B981", cat: "SAN" },
  epidemic:       { icon: <HeartPulse className="w-3 h-3" />,           label: "ÉPIDÉMIE",     color: "#059669", cat: "SAN" },
  outbreak:       { icon: <Biohazard className="w-3 h-3" />,            label: "FOYER",        color: "#059669", cat: "SAN" },
  biological:     { icon: <Biohazard className="w-3 h-3" />,            label: "BIOLOGIQUE",   color: "#10B981", cat: "SAN" },
  diplomatic:     { icon: <Globe2 className="w-3 h-3" />,               label: "DIPLOMATIE",   color: "#60A5FA", cat: "INF" },
  political:      { icon: <Gavel className="w-3 h-3" />,                label: "POLITIQUE",    color: "#818CF8", cat: "POL" },
  "military-move":{ icon: <Navigation2 className="w-3 h-3" />,         label: "DÉPLOIEMENT",  color: "#93C5FD", cat: "MIL" },
  sanctions:      { icon: <Ban className="w-3 h-3" />,                  label: "SANCTIONS",    color: "#A855F7", cat: "POL" },
  protest:        { icon: <Megaphone className="w-3 h-3" />,            label: "MANIFESTATION",color: "#FBBF24", cat: "INF" },
  humanitarian:   { icon: <Shield className="w-3 h-3" />,               label: "HUMANITAIRE",  color: "#F97316", cat: "INF" },
  breaking:       { icon: <Radio className="w-3 h-3" />,                label: "BREAKING",     color: "#F97316", cat: "INF" },
  warning:        { icon: <AlertTriangle className="w-3 h-3" />,        label: "ALERTE",       color: "#00C8D4", cat: "INF" },
  info:           { icon: <Search className="w-3 h-3" />,               label: "INFO",         color: "#6B7280", cat: "INF" },
};

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const SEV_COLORS: Record<string, string> = {
  critical: "#F02D3A",
  high:     "#F59E0B",
  medium:   "#00C8D4",
  low:      "#4B5563",
};
const SEV_LABELS: Record<string, string> = {
  critical: "CRITIQUE", high: "ÉLEVÉ", medium: "MOYEN", low: "BAS",
};

type Cat    = "ALL" | "MIL" | "NAT" | "MET" | "SAN" | "POL" | "INF";
type SortBy = "severity" | "time";

const CATS: { key: Cat; label: string; color: string }[] = [
  { key: "ALL", label: "Tout",    color: "#FFFFFF"  },
  { key: "MIL", label: "Mil",    color: "#F02D3A"  },
  { key: "NAT", label: "Nat",    color: "#F97316"  },
  { key: "MET", label: "Mét",    color: "#3B82F6"  },
  { key: "SAN", label: "San",    color: "#10B981"  },
  { key: "POL", label: "Pol",    color: "#A855F7"  },
  { key: "INF", label: "Info",   color: "#60A5FA"  },
];

const REGIONS: Record<string, { label: string; codes: Set<string> | null }> = {
  ALL:      { label: "Monde",    codes: null },
  MIDEAST:  { label: "M.Orient", codes: new Set(["IR","IL","PS","SY","IQ","YE","LB","JO","SA","AE","KW","QA","BH","OM","TR"]) },
  EUROPE:   { label: "Europe",   codes: new Set(["UA","RU","RS","XK","BY","PL","GE","AM","AZ","BA","MK","FR","DE","GB","MD","RO","HU","BG","HR","AL","ME","LT","LV","EE","FI","SE","NO","CH","IT","ES","PT","NL","BE","GR","CY","SK","CZ","SI"]) },
  ASIA:     { label: "Asie",     codes: new Set(["CN","KP","KR","TW","IN","PK","AF","MM","VN","PH","ID","JP","BD","NP","TH","KH","LA","MY","MN","KZ","UZ","TM","KG","TJ"]) },
  AFRICA:   { label: "Afrique",  codes: new Set(["SD","ET","SO","ML","NG","CD","CF","SS","LY","MZ","ZW","ZA","MA","DZ","TN","KE","TZ","UG","RW","BI","GN","CI","GH","SN","CM","AO","ZM","BF","NE","TD","ER"]) },
  AMERICAS: { label: "Amériques",codes: new Set(["VE","CO","MX","BR","US","PE","BO","EC","CU","GT","HN","SV","NI","PA","PY","UY","AR","CL","DO","HT"]) },
};

function getCat(type?: string | null, category?: string | null): Cat {
  if (!type && !category) return "MIL";
  const NAT = new Set(["earthquake","tsunami","volcano","flood","wildfire","avalanche","landslide"]);
  const MET = new Set(["hurricane","cyclone","tornado","storm","heatwave","cold-snap","drought"]);
  const SAN = new Set(["pandemic","epidemic","outbreak","biological"]);
  const POL = new Set(["coup","political","sanctions","diplomatic"]);
  const INF = new Set(["info","breaking","warning","protest","humanitarian","military-move"]);
  if (type) {
    if (NAT.has(type)) return "NAT";
    if (MET.has(type)) return "MET";
    if (SAN.has(type)) return "SAN";
    if (POL.has(type)) return "POL";
    if (INF.has(type)) return "INF";
  }
  const up = (category ?? "").toUpperCase();
  if (up === "DISASTER" || up === "CATASTROPHE") return "NAT";
  if (up === "WEATHER"  || up === "MÉTÉO")        return "MET";
  if (up === "HEALTH"   || up === "SANTÉ")         return "SAN";
  if (up === "POLITICAL"|| up === "GEOPOLITICAL")  return "POL";
  if (up === "INFO")                               return "INF";
  return "MIL";
}

// ── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ alert, isNew }: { alert: Alert; isNew: boolean }) {
  const meta     = TYPE_META[alert.type ?? ""] ?? TYPE_META.info;
  const sevColor = SEV_COLORS[alert.severity] ?? "#6B7280";
  const srcBadge = parseSourceBadge(alert.source, (alert as any).sourceType);
  const aiLabel  = (alert as any).aiLabel as string | null | undefined;
  const title    = aiLabel ?? alert.title;
  const ago      = alert.timestamp
    ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })
    : "À l'instant";

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("focus-alert", {
      detail: { lat: Number(alert.lat), lng: Number(alert.lng), alertId: alert.id },
    }));
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        "w-full text-left rounded-lg transition-all duration-200 group overflow-hidden",
        isNew && "alert-new"
      )}
      style={{
        background: isNew ? `${sevColor}10` : "rgba(255,255,255,0.025)",
        borderTop:       "1px solid rgba(255,255,255,0.05)",
        borderRight:     "1px solid rgba(255,255,255,0.05)",
        borderBottom:    "1px solid rgba(255,255,255,0.05)",
        borderLeft:      `3px solid ${sevColor}`,
      }}>

      <div className="px-3 py-2.5">
        {/* Row 1 — type badge + severity + time */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span style={{ color: meta.color }} className="shrink-0">{meta.icon}</span>
            <span className="text-[9px] font-bold uppercase tracking-wide truncate" style={{ color: meta.color }}>
              {meta.label}
            </span>
            <span
              className="text-[8px] font-bold px-1 py-px rounded shrink-0"
              style={{ background: `${sevColor}18`, color: sevColor }}>
              {SEV_LABELS[alert.severity] ?? alert.severity}
            </span>
            {isNew && (
              <span className="text-[7px] font-bold px-1 py-px rounded uppercase shrink-0"
                style={{ background: "rgba(0,200,212,0.15)", color: "#00C8D4" }}>
                NEW
              </span>
            )}
          </div>
          <span className="text-[8px] font-mono text-white/25 shrink-0">{ago}</span>
        </div>

        {/* Row 2 — title */}
        <p className="text-[11px] font-semibold text-white/85 leading-snug line-clamp-2 mb-1.5">
          {title}
        </p>

        {/* Row 3 — country + source */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FlagImg code={alert.countryCode} />
            <span className="text-[9px] text-white/35 truncate max-w-[100px]">
              {alert.country ?? `${Number(alert.lat).toFixed(1)}, ${Number(alert.lng).toFixed(1)}`}
            </span>
          </div>
          <span className="text-[8px] font-mono font-bold px-1.5 py-px rounded"
            style={{ background: `${srcBadge.color}14`, color: srcBadge.color }}>
            {srcBadge.name}
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Main AlertFeed ───────────────────────────────────────────────────────────
export function AlertFeed({ mobile = false }: { mobile?: boolean }) {
  useAlertWebSocket();
  const { data: alerts, isLoading } = useAlerts();

  const [newIds,        setNewIds]        = useState<Set<number>>(new Set());
  const [activeCat,     setActiveCat]     = useState<Cat>("ALL");
  const [activeSev,     setActiveSev]     = useState("ALL");
  const [activeRegion,  setActiveRegion]  = useState("ALL");
  const [search,        setSearch]        = useState("");
  const [showFilters,   setShowFilters]   = useState(false);
  const [sortBy,        setSortBy]        = useState<SortBy>("time");
  const prevIdsRef = useRef<Set<number>>(new Set());

  // Track new alerts for flash animation
  useEffect(() => {
    if (!alerts) return;
    const currentIds = new Set(alerts.map(a => a.id));
    const fresh = new Set<number>();
    currentIds.forEach(id => { if (!prevIdsRef.current.has(id)) fresh.add(id); });
    if (fresh.size > 0) {
      setNewIds(prev => new Set([...prev, ...fresh]));
      setTimeout(() => setNewIds(prev => {
        const n = new Set(prev);
        fresh.forEach(id => n.delete(id));
        return n;
      }), 5000);
    }
    prevIdsRef.current = currentIds;
  }, [alerts]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-4 flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#00C8D4]" />
          <span className="text-[10px] font-medium text-white/40">Acquisition du flux…</span>
        </div>
        <div className="px-3 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
          ))}
        </div>
      </div>
    );
  }

  const H48 = 48 * 60 * 60 * 1000;
  const allAlerts = (alerts ?? []).filter(a => !a.timestamp || (Date.now() - new Date(a.timestamp).getTime()) < H48);

  // Category counts
  const catCounts: Record<string, number> = { ALL: allAlerts.length };
  for (const a of allAlerts) {
    const c = getCat(a.type, (a as any).category);
    catCounts[c] = (catCounts[c] ?? 0) + 1;
  }

  // Filter
  let filtered = allAlerts;
  if (activeCat !== "ALL") filtered = filtered.filter(a => getCat(a.type, (a as any).category) === activeCat);
  if (activeSev !== "ALL") filtered = filtered.filter(a => a.severity === activeSev);
  if (activeRegion !== "ALL") {
    const codes = REGIONS[activeRegion]?.codes;
    if (codes) filtered = filtered.filter(a => a.countryCode && codes.has(a.countryCode));
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.description ?? "").toLowerCase().includes(q) ||
      (a.country ?? "").toLowerCase().includes(q)
    );
  }

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "severity") {
      const sevDiff = (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9);
      if (sevDiff !== 0) return sevDiff;
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    }
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });

  filtered = filtered.slice(0, 100);

  const criticalCount = allAlerts.filter(a => a.severity === "critical").length;
  const highCount     = allAlerts.filter(a => a.severity === "high").length;

  return (
    <div className={clsx("h-full flex flex-col min-h-0", mobile ? "w-full" : "")}>

      {/* Header stats */}
      <div className="px-3 pt-3 pb-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="live-dot" style={{ width: 5, height: 5 }} />
              <span className="text-[9px] font-mono text-white/50 uppercase tracking-wider">
                {filtered.length}/{allAlerts.length} événements
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[9px] font-mono">
              {criticalCount > 0 && (
                <span className="font-bold px-1.5 py-0.5 rounded text-red-400"
                  style={{ background: "rgba(240,45,58,0.12)", border: "1px solid rgba(240,45,58,0.2)" }}>
                  {criticalCount}C
                </span>
              )}
              {highCount > 0 && (
                <span className="font-bold px-1.5 py-0.5 rounded text-amber-400"
                  style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  {highCount}H
                </span>
              )}
            </div>
            <button
              onClick={() => setSortBy(s => s === "severity" ? "time" : "severity")}
              className={clsx(
                "p-1.5 rounded-md transition-all",
                "text-white/30 hover:text-white/60"
              )}
              title={sortBy === "severity" ? "Tri: sévérité" : "Tri: chronologique"}>
              {sortBy === "severity"
                ? <TrendingUp className="w-3 h-3" />
                : <Clock className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setShowFilters(p => !p)}
              className={clsx(
                "p-1.5 rounded-md transition-all",
                showFilters
                  ? "text-[#00C8D4] bg-[rgba(0,200,212,0.10)]"
                  : "text-white/30 hover:text-white/60"
              )}
              title="Filtres">
              <SlidersHorizontal className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-1">
          {CATS.map(c => {
            const active = activeCat === c.key;
            const count  = catCounts[c.key] ?? 0;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCat(c.key)}
                className={clsx(
                  "flex-1 text-center py-1 rounded text-[9px] font-medium transition-all",
                  active ? "text-white" : "text-white/25 hover:text-white/50"
                )}
                style={active ? {
                  background: `${c.color}14`,
                  border:     `1px solid ${c.color}30`,
                  color:       c.color,
                } : {}}>
                {c.label}
                {c.key !== "ALL" && count > 0 && (
                  <span className="ml-0.5 opacity-50 text-[7px]">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-2.5 space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher pays, titre…"
                className="w-full pl-7 pr-3 py-1.5 rounded-md text-[10px] font-mono text-white/70 placeholder:text-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>

            {/* Severity */}
            <div className="flex gap-1">
              {[
                { key: "ALL",      label: "Tout",    color: "#FFFFFF"  },
                { key: "critical", label: "Critique", color: "#F02D3A" },
                { key: "high",     label: "Élevé",   color: "#F59E0B"  },
                { key: "medium",   label: "Moyen",   color: "#00C8D4"  },
                { key: "low",      label: "Bas",     color: "#6B7280"  },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setActiveSev(s.key)}
                  className="flex-1 text-center py-1 rounded text-[8px] font-medium transition-all"
                  style={activeSev === s.key
                    ? { background: `${s.color}14`, color: s.color, border: `1px solid ${s.color}30` }
                    : { color: "rgba(255,255,255,0.25)", border: "1px solid transparent" }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Region */}
            <div className="flex flex-wrap gap-1">
              {Object.entries(REGIONS).map(([key, r]) => (
                <button
                  key={key}
                  onClick={() => setActiveRegion(key)}
                  className="py-0.5 px-2 rounded text-[8px] font-medium transition-all"
                  style={activeRegion === key
                    ? { background: "rgba(0,200,212,0.10)", color: "#00C8D4", border: "1px solid rgba(0,200,212,0.22)" }
                    : { color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sort indicator */}
      <div className="px-3 py-1.5 shrink-0 flex items-center gap-1.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {sortBy === "severity"
          ? <TrendingUp className="w-2.5 h-2.5 text-white/20" />
          : <Clock className="w-2.5 h-2.5 text-white/20" />}
        <span className="text-[8px] font-mono text-white/20 uppercase tracking-wider">
          Trié par {sortBy === "severity" ? "sévérité" : "plus récent"}
        </span>
      </div>

      {/* Alert list */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-2 py-2 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Globe2 className="w-8 h-8 text-white/8 mx-auto mb-3" />
            <p className="text-[10px] font-mono text-white/20">Aucun événement trouvé</p>
            {search && (
              <button onClick={() => setSearch("")}
                className="mt-2 text-[9px] text-[#00C8D4]/50 hover:text-[#00C8D4] transition-colors">
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          filtered.map(a => (
            <AlertCard key={a.id} alert={a} isNew={newIds.has(a.id)} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 shrink-0 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="text-[8px] font-mono text-white/15 uppercase tracking-widest">
          ARGOS · 48h
        </span>
        <span className="text-[8px] font-mono text-white/15">
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
