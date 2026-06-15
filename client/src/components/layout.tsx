import { Link, useLocation } from "wouter";
import { Globe, History, Tv, Radio, BookOpen, Wifi, WifiOff, Loader2, Clock } from "lucide-react";
import { clsx } from "clsx";
import { useServerStatus } from "@/hooks/use-server-status";
import { useAlerts } from "@/hooks/use-alerts";
import { BreakingTicker } from "@/components/breaking-ticker";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/",        icon: Globe,   label: "Globe"      },
  { href: "/history", icon: History, label: "Historique" },
  { href: "/live",    icon: Tv,      label: "Live"       },
  { href: "/radio",   icon: Radio,   label: "Radio"      },
  { href: "/guide",   icon: BookOpen,label: "Guide"      },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const serverStatus = useServerStatus();
  const { data: alerts } = useAlerts();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const criticalCount = (alerts ?? []).filter(a => a.severity === "critical").length;
  const timeStr = time.toUTCString().slice(17, 25) + " UTC";

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: "#060810" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-11 flex items-center px-4 gap-4 z-50 relative"
        style={{ background: "rgba(6,8,16,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0 select-none w-36">
          <img src="/argos.svg" alt="ARGOS" className="h-6 w-auto" />
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold font-mono text-white/90 tracking-widest uppercase">ARGOS</span>
              <span className="text-[8px] font-bold font-mono px-1 py-px rounded"
                style={{ background: "rgba(0,200,212,0.12)", color: "#00C8D4", border: "1px solid rgba(0,200,212,0.2)" }}>
                V7
              </span>
            </div>
            <span className="text-[7px] font-mono text-white/20 tracking-widest">INTELLIGENCE</span>
          </div>
        </div>

        {/* Navigation — center */}
        <nav className="flex-1 flex items-center justify-center gap-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}
                className={clsx(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium tracking-wide transition-all duration-150",
                  active
                    ? "text-[#00C8D4] nav-active-underline"
                    : "text-white/35 hover:text-white/65"
                )}
                style={active
                  ? { background: "rgba(0,200,212,0.07)", border: "1px solid rgba(0,200,212,0.15)" }
                  : { border: "1px solid transparent" }}>
                <Icon className={clsx("w-3.5 h-3.5 shrink-0", active ? "text-[#00C8D4]" : "text-white/30")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right — status + time */}
        <div className="flex items-center gap-3 shrink-0 w-36 justify-end">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{ background: "rgba(240,45,58,0.1)", border: "1px solid rgba(240,45,58,0.25)" }}>
              <span className="live-dot" style={{ width: 5, height: 5 }} />
              <span className="text-[9px] font-mono font-bold text-red-400">{criticalCount}C</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {serverStatus === "ok" && <span className="live-dot live-dot-cyan" style={{ width: 5, height: 5 }} />}
            {serverStatus === "connecting" && <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />}
            {serverStatus === "error" && <WifiOff className="w-3 h-3 text-red-500" />}
            <span className="text-[9px] font-mono text-white/30 hidden lg:block">{timeStr}</span>
          </div>
        </div>
      </header>

      {/* Breaking ticker */}
      <BreakingTicker alerts={alerts ?? []} />

      {/* Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        {children}
      </main>
    </div>
  );
}
