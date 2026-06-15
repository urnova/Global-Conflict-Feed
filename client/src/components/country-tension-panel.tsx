import { useCountryTension, type CountryTensionEntry } from "@/hooks/use-country-tension";
import { clsx } from "clsx";
import { RefreshCw, Flame, ShieldAlert, AlertOctagon, Eye, Activity, Shield, ChevronRight } from "lucide-react";
import { useState } from "react";

type TensionStatus = CountryTensionEntry["status"];

const STATUS_META: Record<TensionStatus, { label: string; color: string; bg: string; icon: React.ReactNode; order: number }> = {
  war:        { label: "GUERRE",       color: "#FF1A3E", bg: "rgba(255,26,62,0.12)",   icon: <Flame className="w-3 h-3" />,        order: 0 },
  high:       { label: "ÉLEVÉ",        color: "#FF5500", bg: "rgba(255,85,0,0.10)",    icon: <ShieldAlert className="w-3 h-3" />,  order: 1 },
  tension:    { label: "TENSION",      color: "#FFB800", bg: "rgba(255,184,0,0.09)",   icon: <AlertOctagon className="w-3 h-3" />, order: 2 },
  sanctions:  { label: "SANCTIONS",    color: "#AA44FF", bg: "rgba(170,68,255,0.09)",  icon: <Activity className="w-3 h-3" />,     order: 3 },
  watchlist:  { label: "SURVEILLANCE", color: "#00F5FF", bg: "rgba(0,245,255,0.07)",   icon: <Eye className="w-3 h-3" />,         order: 4 },
  stable:     { label: "STABLE",       color: "#3DBE7A", bg: "rgba(61,190,122,0.07)",  icon: <Shield className="w-3 h-3" />,      order: 5 },
};

export function getTensionStatusColor(status: TensionStatus): string {
  return STATUS_META[status]?.color ?? "#FFFFFF";
}

const COUNTRY_CENTERS: Record<string, [number, number]> = {
  UA: [49.0, 31.0], RU: [61.5, 90.0], PS: [31.5, 34.4], IL: [31.0, 35.0],
  SD: [15.6, 32.5], YE: [15.5, 47.5], MM: [19.2, 96.7], SS: [7.8, 29.7],
  SO: [5.2, 46.2],  AF: [33.9, 67.7], SY: [35.0, 38.0], KP: [40.0, 127.0],
  IR: [32.4, 53.7], IQ: [33.2, 43.7], LY: [26.3, 17.2], ML: [17.6, -2.0],
  CF: [6.6, 20.9],  NG: [9.1, 8.7],   ET: [9.1, 40.5],  PK: [30.4, 69.3],
  TW: [23.7, 121.0],CN: [35.9, 104.2],LB: [33.9, 35.5], AZ: [40.1, 47.6],
  AM: [40.1, 45.0], MZ: [-18.7, 35.0],HT: [19.0, -72.3],VE: [6.4, -66.6],
  CD: [-4.0, 21.8], RS: [44.0, 21.0], GE: [42.3, 43.4], BY: [53.7, 27.9],
};

const TIER_FILTERS: { key: string; label: string; statuses: TensionStatus[] }[] = [
  { key: "ALL",      label: "TOUT",     statuses: ["war","high","tension","sanctions","watchlist","stable"] },
  { key: "GUERRE",   label: "GUERRE",   statuses: ["war"] },
  { key: "CRITIQUE", label: "CRITIQUE", statuses: ["high","tension"] },
  { key: "SUIVI",    label: "SUIVI",    statuses: ["sanctions","watchlist"] },
  { key: "STABLE",   label: "STABLE",   statuses: ["stable"] },
];

function FlagImg({ code }: { code?: string | null }) {
  if (!code || code.length !== 2) return <span className="text-xs">🌍</span>;
  const c = code.toLowerCase();
  return (
    <img src={`https://flagcdn.com/20x15/${c}.png`}
      srcSet={`https://flagcdn.com/40x30/${c}.png 2x`}
      width="20" height="15" alt={code}
      className="shrink-0 rounded-sm" style={{ display: "inline", verticalAlign: "middle" }} />
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="w-10 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function CountryRow({ entry, rank, onClick }: { entry: CountryTensionEntry; rank: number; onClick: (e: CountryTensionEntry) => void }) {
  const meta = STATUS_META[entry.status] ?? STATUS_META.stable;
  return (
    <button
      className="w-full text-left px-2.5 py-2 flex items-center gap-2 group transition-all duration-150 relative"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
      onClick={() => onClick(entry)}
      title={entry.reason}
    >
      {/* Status accent bar */}
      <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full" style={{ background: meta.color, opacity: 0.6 }} />

      {/* Rank */}
      <span className="text-[8px] font-mono text-white/20 w-4 shrink-0 select-none ml-1">
        {rank < 10 ? `0${rank}` : rank}
      </span>

      {/* Flag */}
      <FlagImg code={entry.code} />

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-white/90 truncate leading-tight">{entry.name}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span style={{ color: meta.color }} className="opacity-70">{meta.icon}</span>
          <span className="text-[8px] font-mono font-bold uppercase tracking-wide" style={{ color: meta.color, opacity: 0.8 }}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Score + events */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <ScoreBar score={entry.score} color={meta.color} />
        {entry.activeAlerts > 0 && (
          <span className="text-[8px] font-mono" style={{ color: meta.color, opacity: 0.75 }}>
            {entry.activeAlerts}
          </span>
        )}
      </div>

      <ChevronRight className="w-2.5 h-2.5 text-white/10 group-hover:text-white/30 transition-colors shrink-0" />
    </button>
  );
}

interface Props {
  onCountryClick?: (code: string, lat?: number, lng?: number) => void;
  onHide?: () => void;
  mobile?: boolean;
}

export function CountryTensionPanel({ onCountryClick, onHide, mobile = false }: Props) {
  const { data: tensions, isLoading, refetch } = useCountryTension();
  const [activeFilter, setActiveFilter] = useState("ALL");

  const handleClick = (entry: CountryTensionEntry) => {
    const coords = COUNTRY_CENTERS[entry.code];
    onCountryClick?.(entry.code, coords?.[0], coords?.[1]);
  };

  const warCount    = tensions?.filter(t => t.status === "war").length ?? 0;
  const highCount   = tensions?.filter(t => t.status === "high").length ?? 0;
  const tensionCount= tensions?.filter(t => t.status === "tension").length ?? 0;

  const currentFilter = TIER_FILTERS.find(f => f.key === activeFilter) ?? TIER_FILTERS[0];
  const filtered = tensions
    ? tensions.filter(t => currentFilter.statuses.includes(t.status as TensionStatus))
    : [];

  return (
    <div className={clsx("glass-sidebar h-full flex flex-col", mobile ? "w-full" : "w-52")}
      style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Header */}
      <div className="px-3 pt-3 pb-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="live-dot" style={{ width: 7, height: 7 }} />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/80">Tensions</span>
          </div>
          <button onClick={() => refetch()} title="Actualiser"
            className="text-white/20 hover:text-[#00F5FF] transition-colors p-0.5 rounded">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: "GUERRE",  count: warCount,    color: "#FF1A3E" },
            { label: "ÉLEVÉ",   count: highCount,   color: "#FF5500" },
            { label: "TENSION", count: tensionCount, color: "#FFB800" },
          ].map(s => (
            <div key={s.label} className="rounded-md py-1.5 text-center"
              style={{ background: `${s.color}10`, border: `1px solid ${s.color}22` }}>
              <div className="text-[11px] font-black" style={{ color: s.color }}>{s.count}</div>
              <div className="text-[7px] font-mono text-white/30 uppercase tracking-wide mt-px">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-px px-2 py-1.5 shrink-0 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {TIER_FILTERS.map(f => (
          <button key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={clsx(
              "text-[7.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded transition-all whitespace-nowrap",
              activeFilter === f.key
                ? "text-[#00F5FF] bg-[rgba(0,245,255,0.1)] border border-[rgba(0,245,255,0.25)]"
                : "text-white/25 hover:text-white/50 border border-transparent"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-1.5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          filtered.slice(0, 40).map((entry, i) => (
            <CountryRow key={entry.code} entry={entry} rank={i + 1} onClick={handleClick} />
          ))
        ) : (
          <div className="p-6 text-center">
            <div className="text-[9px] font-mono text-white/20 leading-relaxed">
              Aucune donnée<br />dans cette catégorie
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 shrink-0 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="text-[7px] font-mono text-white/15 uppercase tracking-widest">ARGOS · LIVE</span>
      </div>
    </div>
  );
}
