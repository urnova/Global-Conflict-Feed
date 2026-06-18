import { useCountryTension, type CountryTensionEntry } from "@/hooks/use-country-tension";
import { clsx } from "clsx";
import { RefreshCw, Flame, ShieldAlert, AlertOctagon, Eye, Shield, Activity, ChevronRight } from "lucide-react";
import { useState } from "react";

type TensionStatus = CountryTensionEntry["status"];

const STATUS_META: Record<TensionStatus, { label: string; color: string; bg: string; icon: React.ReactNode; order: number }> = {
  war:       { label: "War",       color: "#F02D3A", bg: "rgba(240,45,58,0.10)",   icon: <Flame className="w-3 h-3" />,       order: 0 },
  high:      { label: "High",      color: "#EF4444", bg: "rgba(239,68,68,0.08)",   icon: <ShieldAlert className="w-3 h-3" />, order: 1 },
  tension:   { label: "Tension",   color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  icon: <AlertOctagon className="w-3 h-3" />,order: 2 },
  sanctions: { label: "Sanctions", color: "#A855F7", bg: "rgba(168,85,247,0.08)",  icon: <Activity className="w-3 h-3" />,    order: 3 },
  watchlist: { label: "Watchlist", color: "#00C8D4", bg: "rgba(0,200,212,0.07)",   icon: <Eye className="w-3 h-3" />,         order: 4 },
  stable:    { label: "Stable",    color: "#10B981", bg: "rgba(16,185,129,0.07)",  icon: <Shield className="w-3 h-3" />,      order: 5 },
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

const TIER_FILTERS = [
  { key: "ALL",      label: "All",      statuses: ["war","high","tension","sanctions","watchlist","stable"] as TensionStatus[] },
  { key: "GUERRE",   label: "War",      statuses: ["war"] as TensionStatus[] },
  { key: "CRITIQUE", label: "Critical", statuses: ["high","tension"] as TensionStatus[] },
  { key: "SUIVI",    label: "Watch",    statuses: ["sanctions","watchlist"] as TensionStatus[] },
  { key: "STABLE",   label: "Stable",   statuses: ["stable"] as TensionStatus[] },
];

function FlagImg({ code }: { code?: string | null }) {
  if (!code || code.length !== 2) return <span className="text-xs opacity-30">🌍</span>;
  return (
    <img
      src={`https://flagcdn.com/20x15/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/40x30/${code.toLowerCase()}.png 2x`}
      width="20" height="15" alt={code}
      className="shrink-0 rounded-sm opacity-75"
    />
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="w-10 h-0.5 rounded-full overflow-hidden bg-white/5">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function CountryRow({ entry, rank, onClick }: {
  entry: CountryTensionEntry;
  rank: number;
  onClick: (e: CountryTensionEntry) => void;
}) {
  const meta = STATUS_META[entry.status] ?? STATUS_META.stable;
  return (
    <button
      className="w-full text-left px-3 py-2 flex items-center gap-2.5 group transition-all duration-100 relative hover:bg-white/[0.02]"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
      onClick={() => onClick(entry)}
      title={entry.reason}>

      {/* Status accent */}
      <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full" style={{ background: meta.color, opacity: 0.55 }} />

      {/* Rank */}
      <span className="text-[9px] font-mono text-white/15 w-4 shrink-0 select-none text-right">
        {rank}
      </span>

      {/* Flag */}
      <FlagImg code={entry.code} />

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-white/85 truncate leading-tight">{entry.name}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span style={{ color: meta.color, opacity: 0.6 }} className="shrink-0">{meta.icon}</span>
          <span className="text-[8px] font-mono font-semibold uppercase tracking-wide" style={{ color: meta.color, opacity: 0.75 }}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Score + alerts */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <ScoreBar score={entry.score} color={meta.color} />
        {entry.activeAlerts > 0 && (
          <span className="text-[8px] font-mono font-bold" style={{ color: meta.color, opacity: 0.65 }}>
            {entry.activeAlerts}
          </span>
        )}
      </div>

      <ChevronRight className="w-2.5 h-2.5 text-white/8 group-hover:text-white/25 transition-colors shrink-0" />
    </button>
  );
}

export function CountryTensionPanel({
  onCountryClick,
  mobile = false,
}: {
  onCountryClick?: (code: string, lat?: number, lng?: number) => void;
  onHide?: () => void;
  mobile?: boolean;
}) {
  const { data: tensions, isLoading, refetch } = useCountryTension();
  const [activeFilter, setActiveFilter] = useState("ALL");

  const handleClick = (entry: CountryTensionEntry) => {
    const coords = COUNTRY_CENTERS[entry.code];
    onCountryClick?.(entry.code, coords?.[0], coords?.[1]);
  };

  const warCount     = tensions?.filter(t => t.status === "war").length ?? 0;
  const highCount    = tensions?.filter(t => t.status === "high").length ?? 0;
  const tensionCount = tensions?.filter(t => t.status === "tension").length ?? 0;

  const currentFilter = TIER_FILTERS.find(f => f.key === activeFilter) ?? TIER_FILTERS[0];
  const filtered = tensions
    ? tensions.filter(t => currentFilter.statuses.includes(t.status as TensionStatus))
    : [];

  return (
    <div
      className={clsx("h-full flex flex-col min-h-0", mobile ? "w-full" : "w-[220px]")}
      style={{ background: "rgba(6,8,16,0.95)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Header */}
      <div className="px-3 pt-3 pb-2.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="live-dot live-dot-cyan" style={{ width: 5, height: 5 }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Tensions</span>
          </div>
          <button
            onClick={() => refetch()}
            className="text-white/20 hover:text-[#00C8D4] transition-colors p-1 rounded-md hover:bg-white/5"
            title="Refresh">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: "War",     count: warCount,    color: "#F02D3A" },
            { label: "High",    count: highCount,   color: "#EF4444" },
            { label: "Tension", count: tensionCount, color: "#F59E0B" },
          ].map(s => (
            <div key={s.label} className="rounded-md py-1.5 text-center"
              style={{ background: `${s.color}0e`, border: `1px solid ${s.color}20` }}>
              <div className="text-[13px] font-bold tabular-nums" style={{ color: s.color }}>{s.count}</div>
              <div className="text-[7px] font-mono text-white/25 uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-2 py-2 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {TIER_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className="flex-1 text-[7.5px] font-medium uppercase tracking-wide py-1 rounded transition-all whitespace-nowrap"
            style={activeFilter === f.key
              ? { background: "rgba(0,200,212,0.10)", color: "#00C8D4", border: "1px solid rgba(0,200,212,0.22)" }
              : { color: "rgba(255,255,255,0.22)", border: "1px solid transparent" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Country list */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="p-3 space-y-1.5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          filtered.slice(0, 40).map((entry, i) => (
            <CountryRow key={entry.code} entry={entry} rank={i + 1} onClick={handleClick} />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-[9px] font-mono text-white/20 leading-relaxed">
              No data<br />in this category
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 shrink-0 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="text-[7px] font-mono text-white/12 uppercase tracking-widest">
          {filtered.length} countries · ARGOS Live
        </span>
      </div>
    </div>
  );
}
