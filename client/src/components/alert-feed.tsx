import { useAlerts } from "@/hooks/use-alerts";
import { useAlertWebSocket } from "@/hooks/use-websocket";
import {
  Navigation2, Zap, FlameKindling, Anchor, Crosshair, Shield, Cpu,
  Skull, Flame, Gavel, Ban, Megaphone, Radio, AlertTriangle, Search,
  Waves, Mountain, Droplets, Wind, Tornado, CloudLightning, ThermometerSun,
  Biohazard, HeartPulse, Globe2, X, SlidersHorizontal, Activity, Layers
} from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { parseSourceBadge } from "@/lib/source-badge";
import type { Alert } from "@shared/schema";

function FlagImg({ code }: { code?: string | null }) {
  if (!code || code.length !== 2) return <Globe2 className="w-3 h-3 text-white/30" />;
  return (
    <img src={`https://flagcdn.com/20x15/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/40x30/${code.toLowerCase()}.png 2x`}
      width="20" height="15" alt={code}
      className="rounded-sm shrink-0" style={{ display: "inline", verticalAlign: "middle" }} />
  );
}

const TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string; cat: string }> = {
  missile:       { icon: <Navigation2 className="w-3 h-3 rotate-45" />, label: "MISSILE",     color: "#FF1A3E", cat: "MIL" },
  airstrike:     { icon: <Zap className="w-3 h-3" />,                   label: "FRAPPE AÉRO", color: "#FF4400", cat: "MIL" },
  artillery:     { icon: <FlameKindling className="w-3 h-3" />,         label: "ARTILLERIE",  color: "#FF6600", cat: "MIL" },
  naval:         { icon: <Anchor className="w-3 h-3" />,                label: "NAVAL",       color: "#0088FF", cat: "MIL" },
  conflict:      { icon: <Crosshair className="w-3 h-3" />,             label: "COMBAT",      color: "#FF8800", cat: "MIL" },
  explosion:     { icon: <Shield className="w-3 h-3" />,               label: "EXPLOSION",   color: "#FF3300", cat: "MIL" },
  chemical:      { icon: <Biohazard className="w-3 h-3" />,            label: "CHIMIQUE",    color: "#88FF44", cat: "MIL" },
  nuclear:       { icon: <Activity className="w-3 h-3" />,             label: "NUCLÉAIRE",   color: "#FF00FF", cat: "MIL" },
  cyber:         { icon: <Cpu className="w-3 h-3" />,                  label: "CYBER",       color: "#00F5FF", cat: "MIL" },
  massacre:      { icon: <Skull className="w-3 h-3" />,                label: "MASSACRE",    color: "#CC0000", cat: "MIL" },
  terrorism:     { icon: <Flame className="w-3 h-3" />,                label: "TERRORISME",  color: "#FF1100", cat: "MIL" },
  coup:          { icon: <Gavel className="w-3 h-3" />,                label: "COUP D'ÉTAT", color: "#AA44FF", cat: "POL" },
  earthquake:    { icon: <Activity className="w-3 h-3" />,             label: "SÉISME",      color: "#FF6B00", cat: "NAT" },
  tsunami:       { icon: <Waves className="w-3 h-3" />,                label: "TSUNAMI",     color: "#4488FF", cat: "NAT" },
  volcano:       { icon: <Mountain className="w-3 h-3" />,             label: "VOLCAN",      color: "#FF3300", cat: "NAT" },
  flood:         { icon: <Droplets className="w-3 h-3" />,             label: "INONDATION",  color: "#3B9EFF", cat: "NAT" },
  wildfire:      { icon: <Flame className="w-3 h-3" />,                label: "INCENDIE",    color: "#FF5E00", cat: "NAT" },
  avalanche:     { icon: <Mountain className="w-3 h-3" />,             label: "AVALANCHE",   color: "#AADDFF", cat: "NAT" },
  landslide:     { icon: <Mountain className="w-3 h-3" />,             label: "GLISSEMENT",  color: "#AA7700", cat: "NAT" },
  hurricane:     { icon: <Wind className="w-3 h-3" />,                 label: "OURAGAN",     color: "#3B9EFF", cat: "MET" },
  cyclone:       { icon: <Wind className="w-3 h-3" />,                 label: "CYCLONE",     color: "#3B9EFF", cat: "MET" },
  tornado:       { icon: <Tornado className="w-3 h-3" />,              label: "TORNADE",     color: "#6699FF", cat: "MET" },
  storm:         { icon: <CloudLightning className="w-3 h-3" />,       label: "TEMPÊTE",     color: "#7799FF", cat: "MET" },
  heatwave:      { icon: <ThermometerSun className="w-3 h-3" />,       label: "CANICULE",    color: "#FFAA00", cat: "MET" },
  "cold-snap":   { icon: <Wind className="w-3 h-3" />,                 label: "GRAND FROID", color: "#AADDFF", cat: "MET" },
  drought:       { icon: <ThermometerSun className="w-3 h-3" />,       label: "SÉCHERESSE",  color: "#CC8800", cat: "MET" },
  pandemic:      { icon: <Biohazard className="w-3 h-3" />,            label: "PANDÉMIE",    color: "#00D68F", cat: "SAN" },
  epidemic:      { icon: <HeartPulse className="w-3 h-3" />,           label: "ÉPIDÉMIE",    color: "#00C080", cat: "SAN" },
  outbreak:      { icon: <Biohazard className="w-3 h-3" />,            label: "FOYER",       color: "#00B070", cat: "SAN" },
  biological:    { icon: <Biohazard className="w-3 h-3" />,            label: "BIOLOGIQUE",  color: "#00D68F", cat: "SAN" },
  diplomatic:    { icon: <Globe2 className="w-3 h-3" />,               label: "DIPLOMATIE",  color: "#44AAFF", cat: "INF" },
  political:     { icon: <Gavel className="w-3 h-3" />,                label: "POLITIQUE",   color: "#8888FF", cat: "POL" },
  "military-move":{ icon: <Navigation2 className="w-3 h-3" />,         label: "DÉPLOIEMENT", color: "#88AAFF", cat: "MIL" },
  sanctions:     { icon: <Ban className="w-3 h-3" />,                  label: "SANCTIONS",   color: "#8888FF", cat: "POL" },
  protest:       { icon: <Megaphone className="w-3 h-3" />,            label: "MANIFESTATION",color: "#FFCC00", cat: "INF" },
  humanitarian:  { icon: <Shield className="w-3 h-3" />,               label: "HUMANITAIRE", color: "#FF7700", cat: "INF" },
  breaking:      { icon: <Radio className="w-3 h-3" />,                label: "BREAKING",    color: "#FF8800", cat: "INF" },
  warning:       { icon: <AlertTriangle className="w-3 h-3" />,        label: "ALERTE",      color: "#00F5FF", cat: "INF" },
  info:          { icon: <Search className="w-3 h-3" />,               label: "INFO",        color: "#888888", cat: "INF" },
};

const SEV_COLORS: Record<string, string> = {
  critical: "#FF1A3E",
  high:     "#FFB800",
  medium:   "#00F5FF",
  low:      "#666666",
};

const SEV_LABELS: Record<string, string> = {
  critical: "CRITIQUE", high: "ÉLEVÉ", medium: "MOYEN", low: "BAS",
};

type Cat = "ALL" | "MIL" | "NAT" | "MET" | "SAN" | "POL" | "INF";

const CATS: { key: Cat; label: string; color: string }[] = [
  { key: "ALL", label: "TOUT",    color: "#FFFFFF" },
  { key: "MIL", label: "MIL",    color: "#FF1A3E" },
  { key: "NAT", label: "NAT",    color: "#FF6B00" },
  { key: "MET", label: "MÉT",    color: "#3B9EFF" },
  { key: "SAN", label: "SAN",    color: "#00D68F" },
  { key: "POL", label: "POL",    color: "#AA44FF" },
  { key: "INF", label: "INF",    color: "#44AAFF" },
];

const REGIONS: Record<string, { label: string; codes: Set<string> | null }> = {
  ALL:     { label: "MONDE",        codes: null },
  MIDEAST: { label: "M.ORIENT",     codes: new Set(["IR","IL","PS","SY","IQ","YE","LB","JO","SA","AE","KW","QA","BH","OM","TR"]) },
  EUROPE:  { label: "EUROPE",       codes: new Set(["UA","RU","RS","XK","BY","PL","GE","AM","AZ","BA","MK","FR","DE","GB","MD","RO","HU","BG","HR","AL","ME","LT","LV","EE","FI","SE","NO","CH","IT","ES","PT","NL","BE","GR","CY","SK","CZ","SI"]) },
  ASIA:    { label: "ASIE",         codes: new Set(["CN","KP","KR","TW","IN","PK","AF","MM","VN","PH","ID","JP","BD","NP","TH","KH","LA","MY","MN","KZ","UZ","TM","KG","TJ"]) },
  AFRICA:  { label: "AFRIQUE",      codes: new Set(["SD","ET","SO","ML","NG","CD","CF","SS","LY","MZ","ZW","ZA","MA","DZ","TN","KE","TZ","UG","RW","BI","GN","CI","GH","SN","CM","AO","ZM","BF","NE","TD","ER"]) },
  AMERICAS:{ label: "AMÉRIQUES",    codes: new Set(["VE","CO","MX","BR","US","PE","BO","EC","CU","GT","HN","SV","NI","PA","PY","UY","AR","CL","DO","HT"]) },
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

interface AlertGroup {
  _group: true;
  country: string;
  countryCode: string;
  count: number;
  items: Alert[];
  latest: Alert;
}

function groupAlerts(alerts: Alert[]): (Alert | AlertGroup)[] {
  const WINDOW = 10 * 60 * 1000;
  const MIN = 3;
  const result: (Alert | AlertGroup)[] = [];
  let i = 0;
  while (i < alerts.length) {
    const a = alerts[i];
    const ts = a.timestamp ? new Date(a.timestamp).getTime() : Date.now();
    let j = i + 1;
    while (j < alerts.length) {
      const b = alerts[j];
      if (b.countryCode !== a.countryCode) break;
      const ts2 = b.timestamp ? new Date(b.timestamp).getTime() : Date.now();
      if (Math.abs(ts - ts2) > WINDOW) break;
      j++;
    }
    const count = j - i;
    if (count >= MIN && a.countryCode) {
      result.push({ _group: true, country: a.country || a.countryCode, countryCode: a.countryCode, count, items: alerts.slice(i, j), latest: a });
    } else {
      for (let k = i; k < j; k++) result.push(alerts[k]);
    }
    i = j;
  }
  return result;
}

function AlertCard({ alert, isNew }: { alert: Alert; isNew: boolean }) {
  const meta = TYPE_META[alert.type] ?? TYPE_META.info;
  const sevColor = SEV_COLORS[alert.severity] ?? "#888";
  const srcBadge = parseSourceBadge(alert.source, (alert as any).sourceType);
  const aiVerified = (alert as any).aiVerified as boolean | null | undefined;
  const aiLabel = (alert as any).aiLabel as string | null | undefined;
  const displayTitle = aiLabel ?? alert.title;
  const ago = alert.timestamp ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }) : "À l'instant";

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("focus-alert", {
      detail: { lat: Number(alert.lat), lng: Number(alert.lng), alertId: alert.id },
    }));
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        "w-full text-left p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group",
        isNew && "animate-pulse-once"
      )}
      style={{
        background: `${meta.color}07`,
        borderColor: isNew ? `${meta.color}50` : `${meta.color}18`,
      }}
    >
      {/* Ambient glow */}
      <div className="absolute -right-3 -top-3 w-12 h-12 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{ background: meta.color }} />

      {/* Severity bar at top */}
      <div className="absolute top-0 left-0 right-0 h-px rounded-full"
        style={{ background: `linear-gradient(90deg, ${sevColor}80, transparent)` }} />

      {/* Row 1: type + severity + time */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span style={{ color: meta.color }}>{meta.icon}</span>
          <span className="text-[8.5px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-[7.5px] font-bold px-1 py-px rounded"
            style={{ background: `${sevColor}18`, color: sevColor, border: `1px solid ${sevColor}30` }}>
            {SEV_LABELS[alert.severity] ?? alert.severity}
          </span>
          {isNew && (
            <span className="text-[7px] font-bold px-1 py-px rounded uppercase"
              style={{ background: "rgba(0,245,255,0.15)", color: "#00F5FF", border: "1px solid rgba(0,245,255,0.3)" }}>
              NOUVEAU
            </span>
          )}
        </div>
        <span className="text-[8px] font-mono text-white/25 shrink-0">{ago}</span>
      </div>

      {/* AI analysis badge */}
      {aiVerified === null || aiVerified === undefined ? (
        <div className="inline-flex items-center gap-1 text-[7px] font-mono px-1.5 py-px rounded mb-1.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>
          🔍 analyse IA…
        </div>
      ) : aiVerified === false ? (
        <div className="inline-flex items-center gap-1 text-[7px] font-mono px-1.5 py-px rounded mb-1.5"
          style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)" }}>
          ✗ non confirmé
        </div>
      ) : null}

      {/* Title */}
      <h3 className="text-xs font-semibold text-white/90 leading-snug line-clamp-2 mb-1">{displayTitle}</h3>

      {/* Description */}
      {alert.description && (
        <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">{alert.description}</p>
      )}

      {/* Footer */}
      <div className="mt-2 pt-1.5 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-1.5">
          <FlagImg code={alert.countryCode} />
          <span className="text-[8.5px] text-white/40 truncate max-w-[90px]">
            {alert.country ?? `${Number(alert.lat).toFixed(1)}, ${Number(alert.lng).toFixed(1)}`}
          </span>
        </div>
        <span className="text-[7.5px] font-bold px-1.5 py-px rounded"
          style={{ background: `${srcBadge.color}15`, color: srcBadge.color }}>
          {srcBadge.name}
        </span>
      </div>
    </button>
  );
}

function GroupCard({ group }: { group: AlertGroup }) {
  const [expanded, setExpanded] = useState(false);
  const sevColor = SEV_COLORS[group.latest.severity] ?? "#888";
  return (
    <div className="rounded-xl border overflow-hidden"
      style={{ background: `${sevColor}07`, borderColor: `${sevColor}25` }}>
      <button onClick={() => setExpanded(p => !p)}
        className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-white/3 transition-colors">
        <Layers className="w-3 h-3 shrink-0" style={{ color: sevColor }} />
        <div className="flex-1 min-w-0">
          <div className="text-[8.5px] font-bold uppercase tracking-wide flex items-center gap-1" style={{ color: sevColor }}>
            MULTI-IMPACT — <FlagImg code={group.countryCode} /> {group.country}
          </div>
          <div className="text-[9px] text-white/40 font-mono">{group.count} alertes · 10 min</div>
        </div>
        <span className="text-[9px] font-mono text-white/20">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="px-2 pb-2 space-y-1.5 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {group.items.map(a => <AlertCard key={a.id} alert={a} isNew={false} />)}
        </div>
      )}
    </div>
  );
}

export function AlertFeed({ onHide, mobile = false }: { onHide?: () => void; mobile?: boolean }) {
  useAlertWebSocket();
  const { data: alerts, isLoading } = useAlerts();
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [activeCat, setActiveCat] = useState<Cat>("ALL");
  const [activeSev, setActiveSev] = useState("ALL");
  const [activeRegion, setActiveRegion] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const prevIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!alerts) return;
    const currentIds = new Set(alerts.map(a => a.id));
    const fresh = new Set<number>();
    currentIds.forEach(id => { if (!prevIdsRef.current.has(id)) fresh.add(id); });
    if (fresh.size > 0) {
      setNewIds(prev => new Set([...prev, ...fresh]));
      setTimeout(() => setNewIds(prev => { const n = new Set(prev); fresh.forEach(id => n.delete(id)); return n; }), 7000);
    }
    prevIdsRef.current = currentIds;
  }, [alerts]);

  if (isLoading) {
    return (
      <div className={clsx("glass-panel h-full flex flex-col", mobile ? "w-full" : "w-[340px]")}
        style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="p-4 flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#00F5FF] animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Acquisition du flux…</span>
        </div>
        <div className="px-3 space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />)}
        </div>
      </div>
    );
  }

  const H48 = 48 * 60 * 60 * 1000;
  const allAlerts = (alerts ?? []).filter(a => !a.timestamp || (Date.now() - new Date(a.timestamp).getTime()) < H48);

  const catCounts: Record<string, number> = { ALL: allAlerts.length };
  for (const a of allAlerts) {
    const c = getCat(a.type, (a as any).category);
    catCounts[c] = (catCounts[c] ?? 0) + 1;
  }

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
  filtered = filtered.slice(0, 80);
  const grouped = groupAlerts(filtered);

  const criticalCount = allAlerts.filter(a => a.severity === "critical").length;
  const highCount = allAlerts.filter(a => a.severity === "high").length;

  return (
    <div className={clsx("glass-panel h-full flex flex-col", mobile ? "w-full" : "w-[340px]")}
      style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Header */}
      <div className="px-3 pt-3 pb-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="live-dot" style={{ width: 7, height: 7 }} />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/80">Flux Intelligence</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-[9px] font-mono">
              <span className="text-red-400 font-bold">{criticalCount}<span className="text-white/20 ml-px">C</span></span>
              <span className="text-amber-400 font-bold">{highCount}<span className="text-white/20 ml-px">H</span></span>
              <span className="text-white/25">{allAlerts.length} evt</span>
            </div>
            <button onClick={() => setShowFilters(p => !p)}
              className={clsx("p-1 rounded-md transition-all", showFilters ? "text-[#00F5FF] bg-[rgba(0,245,255,0.1)]" : "text-white/25 hover:text-white/60")}
              title="Filtres">
              <SlidersHorizontal className="w-3 h-3" />
            </button>
            {onHide && (
              <button onClick={onHide} className="text-white/20 hover:text-white/50 p-1 rounded transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-px">
          {CATS.map(c => {
            const active = activeCat === c.key;
            const count = catCounts[c.key] ?? 0;
            return (
              <button key={c.key} onClick={() => setActiveCat(c.key)}
                className={clsx(
                  "flex-1 text-center py-1 rounded-md text-[7.5px] font-bold uppercase tracking-wide transition-all",
                  active ? "text-white" : "text-white/25 hover:text-white/50"
                )}
                style={active ? { background: `${c.color}18`, border: `1px solid ${c.color}35`, color: c.color } : {}}>
                {c.label}
                {c.key !== "ALL" && count > 0 && (
                  <span className="ml-0.5 opacity-60 text-[6px]">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-2 space-y-1.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full pl-6 pr-2 py-1 rounded-md text-[10px] font-mono text-white/70 placeholder:text-white/20 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
            {/* Severity */}
            <div className="flex gap-1">
              {["ALL","critical","high","medium","low"].map(s => (
                <button key={s} onClick={() => setActiveSev(s)}
                  className={clsx(
                    "flex-1 text-center py-0.5 rounded text-[7px] font-bold uppercase transition-all",
                    activeSev === s ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                  )}>
                  {s === "ALL" ? "TOUT" : s === "critical" ? "CRIT" : s === "high" ? "ÉLEV" : s === "medium" ? "MOY" : "BAS"}
                </button>
              ))}
            </div>
            {/* Region */}
            <div className="flex gap-1 flex-wrap">
              {Object.entries(REGIONS).map(([key, r]) => (
                <button key={key} onClick={() => setActiveRegion(key)}
                  className={clsx(
                    "py-0.5 px-1.5 rounded text-[7px] font-bold uppercase transition-all",
                    activeRegion === key ? "bg-[rgba(0,245,255,0.1)] text-[#00F5FF] border border-[rgba(0,245,255,0.25)]" : "text-white/20 hover:text-white/45 border border-transparent"
                  )}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {grouped.length === 0 ? (
          <div className="py-12 text-center">
            <Globe2 className="w-8 h-8 text-white/8 mx-auto mb-3" />
            <p className="text-[9px] font-mono text-white/20">Aucun événement trouvé</p>
          </div>
        ) : (
          grouped.map((item, i) => {
            if ("_group" in item && item._group) {
              return <GroupCard key={`g-${item.countryCode}-${i}`} group={item} />;
            }
            const a = item as Alert;
            return <AlertCard key={a.id} alert={a} isNew={newIds.has(a.id)} />;
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 shrink-0 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="text-[7px] font-mono text-white/15 uppercase tracking-widest">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""} · 48h
        </span>
      </div>
    </div>
  );
}
