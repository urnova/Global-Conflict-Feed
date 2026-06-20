/**
 * MobileDashboard — Argos V7
 * Full-screen tabs with bottom navigation bar.
 * Tabs: Globe · Alerts · Tensions · Briefing
 */

import { useState, useEffect, useRef } from "react";
import { Globe2, List, Flame, Brain, Activity } from "lucide-react";
import { useAlerts } from "@/hooks/use-alerts";
import { useServerStatus, useServerHealth } from "@/hooks/use-server-status";
import { AlertFeed } from "@/components/alert-feed";
import { CountryTensionPanel } from "@/components/country-tension-panel";
import { AiSummaryPanel } from "@/components/ai-summary-panel";
import { GlobeView } from "@/components/globe-view";
import { BreakingTicker } from "@/components/breaking-ticker";
import { CriticalAlertOverlay } from "@/components/critical-alert-overlay";
import { ServerErrorOverlay } from "@/components/server-error-overlay";
import { clsx } from "clsx";
import { soundIncoming } from "@/lib/sounds";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "globe" | "flux" | "tensions" | "briefing";

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "globe",    icon: Globe2, label: "Globe"    },
  { id: "flux",     icon: List,   label: "Alerts"   },
  { id: "tensions", icon: Flame,  label: "Tensions" },
  { id: "briefing", icon: Brain,  label: "Briefing" },
];

export function MobileDashboard() {
  const { data: alerts = [] } = useAlerts();
  const serverStatus = useServerStatus();
  const health = useServerHealth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("globe");

  const criticalCount = alerts.filter(a => a.severity === "critical").length;

  // Play notification sound on new incoming alerts
  const prevAlertIds = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!alerts.length) return;
    const newIds = new Set(alerts.map(a => a.id));
    const hasNew = alerts.some(a => !prevAlertIds.current.has(a.id));
    if (prevAlertIds.current.size > 0 && hasNew) {
      soundIncoming();
    }
    prevAlertIds.current = newIds;
  }, [alerts]);

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/health'] });
    queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
  };

  // Show cinematic overlay whenever ANY service is offline
  const showErrorOverlay = !health.groq || !health.db || serverStatus === "error";
  const errorDetails = {
    server: serverStatus === "error",
    db:     !health.db,
    groq:   !health.groq,
  };

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      <CriticalAlertOverlay alerts={alerts} />

      {/* Cinematic offline overlay — covers entire app */}
      {showErrorOverlay && (
        <ServerErrorOverlay errors={errorDetails} onRetry={handleRetry} />
      )}

      {/* Top status bar */}
      <div className="shrink-0 h-8 flex items-center justify-between px-3"
        style={{ background: "rgba(4,6,12,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <img src="/argos.svg" alt="ARGOS" className="h-4 w-auto opacity-80" />
          <span className="text-[8px] font-black font-mono uppercase tracking-[0.2em] text-white/50">Argos V7</span>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ background: "rgba(255,26,62,0.15)", border: "1px solid rgba(255,26,62,0.3)" }}>
              <span className="live-dot" style={{ width: 5, height: 5 }} />
              <span className="text-[7px] font-mono font-bold text-red-400">{criticalCount}C</span>
            </div>
          )}
          {serverStatus === "ok"
            ? <span className="live-dot live-dot-cyan" style={{ width: 6, height: 6 }} />
            : <Activity className="w-3 h-3 text-amber-400 animate-pulse" />}
        </div>
      </div>

      {/* Breaking ticker */}
      <BreakingTicker alerts={alerts} />

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">

        {/* GLOBE */}
        <div className={clsx(
          "absolute inset-0 transition-opacity duration-200",
          tab === "globe" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
        )}>
          <GlobeView
            onToggleBriefing={() => setTab("briefing")}
            showBriefing={false}
            onToggleTensions={() => setTab("tensions")}
            showTensions={false}
            onToggleFeed={() => setTab("flux")}
            showFeed={false}
          />
        </div>

        {/* ALERTS */}
        {tab === "flux" && (
          <div className="absolute inset-0 z-10 overflow-hidden">
            <AlertFeed mobile />
          </div>
        )}

        {/* TENSIONS */}
        {tab === "tensions" && (
          <div className="absolute inset-0 z-10 overflow-hidden">
            <CountryTensionPanel
              mobile
              onCountryClick={() => setTab("globe")}
            />
          </div>
        )}

        {/* BRIEFING — headless to avoid double header */}
        {tab === "briefing" && (
          <div className="absolute inset-0 z-10 flex flex-col overflow-hidden">
            <div className="shrink-0 px-4 pt-4 pb-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <Brain className="w-3.5 h-3.5 text-[#00F5FF]" />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#00F5FF]">
                Strategic Briefing
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AiSummaryPanel headless />
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <nav className="shrink-0 flex z-50"
        style={{ background: "rgba(4,6,12,0.98)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {TABS.map(({ id, icon: Icon, label }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative transition-all"
              style={{ color: active ? "#00F5FF" : "rgba(255,255,255,0.2)" }}>
              {active && (
                <div className="absolute top-0 left-1/4 right-1/4 h-px rounded-full"
                  style={{ background: "linear-gradient(90deg, transparent, #00F5FF, transparent)" }} />
              )}
              <Icon className={clsx("w-4 h-4 transition-all", active ? "text-[#00F5FF]" : "text-white/25")} />
              <span className={clsx(
                "text-[7px] font-bold uppercase tracking-wider transition-all",
                active ? "text-[#00F5FF]" : "text-white/20"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
