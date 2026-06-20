import { Link, useLocation } from "wouter";
import { Globe, History, Satellite, BookOpen, WifiOff, Loader2, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import { useServerStatus, useServerHealth } from "@/hooks/use-server-status";
import { useAlerts } from "@/hooks/use-alerts";
import { BreakingTicker } from "@/components/breaking-ticker";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/",        icon: Globe,     label: "Globe"    },
  { href: "/history", icon: History,   label: "History"  },
  { href: "/live",    icon: Satellite, label: "Live"     },
  { href: "/guide",   icon: BookOpen,  label: "Guide"    },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location]     = useLocation();
  const serverStatus   = useServerStatus();
  const health         = useServerHealth();
  const { data: alerts } = useAlerts();
  const [time, setTime]  = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const criticalCount = (alerts ?? []).filter(a => a.severity === "critical").length;
  const highCount     = (alerts ?? []).filter(a => a.severity === "high").length;
  const timeStr = time.toUTCString().slice(17, 25);
  const isOffline = !health.groq || !health.db || serverStatus === "error";

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: "#060810" }}>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 h-11 flex items-center px-4 gap-4 z-50 relative select-none"
        style={{ background: "rgba(6,8,16,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0 w-40">
          <img src="/argos.svg" alt="ARGOS" className="h-6 w-auto" />
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold font-mono text-white/90 tracking-widest uppercase">ARGOS</span>
              <span className="text-[8px] font-bold font-mono px-1 py-px rounded"
                style={{ background: "rgba(0,200,212,0.12)", color: "#00C8D4", border: "1px solid rgba(0,200,212,0.2)" }}>
                V7
              </span>
            </div>
            <span className="text-[7px] font-mono text-white/20 tracking-widest uppercase">Intelligence</span>
          </div>
        </div>

        {/* Navigation — center */}
        <nav className="flex-1 flex items-center justify-center gap-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}
                className={clsx(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium tracking-wide transition-all duration-150",
                  active ? "text-[#00C8D4]" : "text-white/35 hover:text-white/65 hover:bg-white/[0.03]"
                )}
                style={active
                  ? { background: "rgba(0,200,212,0.07)", border: "1px solid rgba(0,200,212,0.15)" }
                  : { border: "1px solid transparent" }}>
                <Icon className={clsx("w-3.5 h-3.5 shrink-0", active ? "text-[#00C8D4]" : "text-white/25")} />
                <span>{label}</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px rounded-full"
                    style={{ background: "#00C8D4" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right — system status bar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Severity counters */}
          {!isOffline && criticalCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md font-mono"
              style={{
                background: "rgba(240,45,58,0.08)",
                border: "1px solid rgba(240,45,58,0.18)",
              }}>
              <span className="relative flex h-[5px] w-[5px] shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-[5px] w-[5px] bg-red-500" />
              </span>
              <span className="text-[9px] font-bold text-red-400 tabular-nums">{criticalCount}</span>
              <span className="text-[8px] text-red-500/50 uppercase tracking-wider">CRIT</span>
            </div>
          )}
          {!isOffline && highCount > 0 && (
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-md font-mono"
              style={{
                background: "rgba(245,158,11,0.07)",
                border: "1px solid rgba(245,158,11,0.15)",
              }}>
              <AlertTriangle className="w-2.5 h-2.5 text-amber-500/60 shrink-0" />
              <span className="text-[9px] font-bold text-amber-400 tabular-nums">{highCount}</span>
              <span className="text-[8px] text-amber-500/40 uppercase tracking-wider">HIGH</span>
            </div>
          )}

          {/* Separator */}
          <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Connection status + UTC */}
          <div className="flex items-center gap-1.5">
            {serverStatus === "ok" && !isOffline && (
              <span className="live-dot live-dot-cyan" style={{ width: 5, height: 5 }} />
            )}
            {serverStatus === "connecting" && (
              <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
            )}
            {(serverStatus === "error" || isOffline) && (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
            <span className={clsx(
              "text-[9px] font-mono tabular-nums hidden lg:block",
              isOffline ? "text-red-500/60" : "text-white/25"
            )}>
              {isOffline ? "OFFLINE" : timeStr + " UTC"}
            </span>
          </div>
        </div>
      </header>

      {/* Breaking news ticker */}
      <BreakingTicker alerts={alerts ?? []} offline={isOffline} />

      {/* Main content */}
      <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        {children}
      </main>
    </div>
  );
}
