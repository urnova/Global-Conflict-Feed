import { Link, useLocation } from "wouter";
import { Globe, History, BookOpen, Radio, Tv, Activity, AlertTriangle, Loader2, Wifi, WifiOff } from "lucide-react";
import { clsx } from "clsx";
import { useServerStatus } from "@/hooks/use-server-status";
import { useAlerts } from "@/hooks/use-alerts";
import { BreakingTicker } from "@/components/breaking-ticker";

const NAV_ITEMS = [
  { href: "/",        icon: Globe,    label: "GLOBE"      },
  { href: "/history", icon: History,  label: "HISTORIQUE" },
  { href: "/live",    icon: Tv,       label: "LIVE VIEW"  },
  { href: "/radio",   icon: Radio,    label: "RADIO"      },
  { href: "/guide",   icon: BookOpen, label: "GUIDE"      },
];

function StatusDot({ status }: { status: string }) {
  if (status === "ok")
    return (
      <span className="flex items-center gap-1.5">
        <span className="live-dot live-dot-cyan" />
        <span className="text-[9px] font-mono uppercase tracking-widest text-[#00F5FF] hidden lg:block">Actif</span>
      </span>
    );
  if (status === "connecting")
    return (
      <span className="flex items-center gap-1.5">
        <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
        <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 hidden lg:block">Sync…</span>
      </span>
    );
  return (
    <span className="flex items-center gap-1.5">
      <WifiOff className="w-3 h-3 text-red-500" />
      <span className="text-[9px] font-mono uppercase tracking-widest text-red-500 hidden lg:block">Erreur</span>
    </span>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const serverStatus = useServerStatus();
  const { data: alerts } = useAlerts();

  const criticalCount = (alerts ?? []).filter(a => a.severity === "critical").length;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className="shrink-0 h-11 flex items-center px-3 gap-3 z-50 relative"
        style={{ background: "rgba(4,6,12,0.96)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0 select-none">
          <img src="/argos.svg" alt="ARGOS" className="h-6 w-auto" />
          <div className="hidden sm:flex flex-col leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black font-mono text-white/85 uppercase tracking-[0.15em]">Argos</span>
              <span className="text-[8px] font-black font-mono px-1.5 py-px rounded-sm"
                style={{ background: "rgba(0,245,255,0.12)", color: "#00F5FF", border: "1px solid rgba(0,245,255,0.25)" }}>
                V7
              </span>
            </div>
            <span className="text-[7px] font-mono text-white/25 uppercase tracking-[0.2em]">Astral Security</span>
          </div>
        </div>

        {/* Nav — centered */}
        <nav className="absolute inset-0 flex items-center justify-center gap-0.5 pointer-events-none">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}
                className={clsx(
                  "pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all duration-200 relative",
                  active
                    ? "text-[#00F5FF]"
                    : "text-white/35 hover:text-white/70"
                )}
                style={active ? { background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.18)" } : { border: "1px solid transparent" }}
              >
                <Icon className={clsx("w-3.5 h-3.5 shrink-0", active ? "text-[#00F5FF]" : "text-white/35")} />
                <span className="hidden sm:block">{label}</span>
                {active && (
                  <span className="absolute -bottom-px left-2 right-2 h-px rounded-full"
                    style={{ background: "linear-gradient(90deg, transparent, #00F5FF, transparent)" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right — status */}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{ background: "rgba(255,26,62,0.12)", border: "1px solid rgba(255,26,62,0.3)" }}>
              <span className="live-dot" style={{ width: 6, height: 6 }} />
              <span className="text-[9px] font-mono font-bold text-red-400">{criticalCount} CRITIQUE{criticalCount > 1 ? "S" : ""}</span>
            </div>
          )}
          <StatusDot status={serverStatus} />
        </div>
      </header>

      {/* Breaking ticker */}
      <BreakingTicker alerts={alerts ?? []} />

      {/* Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
