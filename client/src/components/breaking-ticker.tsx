import { formatDistanceToNow } from "date-fns";
import type { Alert } from "@shared/schema";

const SEV_COLOR: Record<string, string> = {
  critical: "#FF1A3E",
  high: "#FFB800",
};

const TYPE_ICON: Record<string, string> = {
  missile: "🚀", airstrike: "✈", artillery: "💣", explosion: "💥",
  massacre: "💀", terrorism: "🔴", naval: "⚓", conflict: "⚔",
  nuclear: "☢", chemical: "☣", coup: "⚖", cyber: "💻",
  earthquake: "🌍", tsunami: "🌊", hurricane: "🌀", flood: "💧",
  wildfire: "🔥", volcano: "🌋", pandemic: "🦠", epidemic: "🦠",
};

const SIGNAL_LOST_ITEMS = [
  "SIGNAL LOST", "ERROR BROADCAST", "ARGOS INTELLIGENCE V7",
  "SERVICE UNAVAILABLE", "CONNEXION PERDUE", "SIGNAL LOST",
  "ERROR BROADCAST", "SYSTÈME HORS LIGNE", "SIGNAL LOST",
];

export function BreakingTicker({ alerts, offline = false }: { alerts: Alert[]; offline?: boolean }) {
  if (offline) {
    const doubled = [...SIGNAL_LOST_ITEMS, ...SIGNAL_LOST_ITEMS];
    return (
      <div className="shrink-0 h-6 flex items-center overflow-hidden z-40 relative"
        style={{ background: "rgba(10,2,2,0.97)", borderBottom: "1px solid rgba(220,38,38,0.15)" }}>

        <div className="shrink-0 px-2.5 h-full flex items-center gap-1.5 font-mono"
          style={{ background: "#7f1d1d", minWidth: 56 }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
          <span className="text-[8px] font-black tracking-widest text-red-300 uppercase">ERR</span>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="ticker-track flex items-center whitespace-nowrap">
            {doubled.map((msg, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-5 text-[9px] font-mono font-bold">
                <span className="text-red-600">▮</span>
                <span className="text-red-500/70 tracking-widest uppercase">{msg}</span>
                <span className="text-red-900/50 ml-2">│</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const H12 = 12 * 60 * 60 * 1000;
  const items = alerts
    .filter(a =>
      (a.severity === "critical" || a.severity === "high") &&
      (!a.timestamp || Date.now() - new Date(a.timestamp).getTime() < H12)
    )
    .slice(0, 14);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="shrink-0 h-6 flex items-center overflow-hidden z-40 relative"
      style={{ background: "rgba(3,5,10,0.95)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>

      <div className="shrink-0 px-2.5 h-full flex items-center gap-1.5 font-mono"
        style={{ background: "#FF1A3E", minWidth: 48 }}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
        </span>
        <span className="text-[8px] font-black tracking-widest text-white uppercase">LIVE</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="ticker-track flex items-center whitespace-nowrap">
          {doubled.map((a, i) => {
            const color = SEV_COLOR[a.severity] ?? "#FFFFFF";
            const icon = TYPE_ICON[a.type] ?? "⚠";
            const title = (a as any).aiLabel ?? a.title;
            return (
              <span key={i} className="inline-flex items-center gap-1.5 px-4 text-[9.5px] font-mono">
                <span style={{ color }}>{icon}</span>
                {a.countryCode && a.countryCode.length === 2 && (
                  <img src={`https://flagcdn.com/20x15/${a.countryCode.toLowerCase()}.png`}
                    width="14" height="10" alt={a.countryCode} className="rounded-sm opacity-70" />
                )}
                <span className="text-white/70">{title}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/25 text-[8.5px]">
                  {a.timestamp ? formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }) : "just now"}
                </span>
                <span className="text-white/8 ml-2">│</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
