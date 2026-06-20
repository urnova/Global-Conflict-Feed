import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import { GlobeView } from "@/components/globe-view";
import { AlertFeed } from "@/components/alert-feed";
import { CountryTensionPanel } from "@/components/country-tension-panel";
import { AiSummaryPanel } from "@/components/ai-summary-panel";
import { LoadingScreen } from "@/components/loading-screen";
import { CriticalAlertOverlay } from "@/components/critical-alert-overlay";
import { ServerErrorOverlay } from "@/components/server-error-overlay";
import { MobileDashboard } from "@/components/mobile-dashboard";
import { useAlerts } from "@/hooks/use-alerts";
import { useServerStatus, useServerHealth } from "@/hooks/use-server-status";
import { useDeviceType } from "@/hooks/use-mobile";
import {
  Brain, Map, List, ChevronLeft, ChevronRight,
  Loader2, WifiOff, Volume2, VolumeX
} from "lucide-react";
import { clsx } from "clsx";
import type { Alert } from "@shared/schema";
import { isMuted, toggleMute, soundIncoming } from "@/lib/sounds";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const device = useDeviceType();
  if (device === "mobile" || device === "tablet") return <MobileDashboard />;
  return <DesktopDashboard />;
}

type RightTab = "feed" | "briefing";

function DesktopDashboard() {
  const { data: alerts } = useAlerts();
  const serverStatus = useServerStatus();
  const health = useServerHealth();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(() =>
    typeof sessionStorage === "undefined" ? true : !sessionStorage.getItem("argos_v7_loaded")
  );
  const [focusCountry, setFocusCountry] = useState<{ code: string; lat?: number; lng?: number } | undefined>();
  const [showLeft,  setShowLeft]  = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [rightTab,  setRightTab]  = useState<RightTab>("feed");
  const [muted,     setMuted]     = useState(isMuted());

  // Play sound on new incoming alerts
  const prevAlertIds = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!alerts) return;
    const newIds = new Set(alerts.map(a => a.id));
    const hasNew = alerts.some(a => !prevAlertIds.current.has(a.id));
    if (prevAlertIds.current.size > 0 && hasNew) {
      soundIncoming();
    }
    prevAlertIds.current = newIds;
  }, [alerts]);

  const handleCountryFocus = useCallback((code: string, lat?: number, lng?: number) => {
    setFocusCountry({ code, lat, lng });
  }, []);

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/health'] });
    queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
  }, [queryClient]);

  const H48 = 48 * 60 * 60 * 1000;
  const recentAlerts  = (alerts ?? []).filter(a => !a.timestamp || (Date.now() - new Date(a.timestamp).getTime()) < H48);
  const criticalCount = recentAlerts.filter(a => a.severity === "critical").length;
  const highCount     = recentAlerts.filter(a => a.severity === "high").length;
  const countryCount  = new Set(recentAlerts.map(a => a.countryCode).filter(Boolean)).size;

  // Show cinematic overlay whenever ANY service is offline
  const showErrorOverlay = !health.groq || !health.db || serverStatus === "error";
  const errorDetails = {
    server: serverStatus === "error",
    db:     !health.db,
    groq:   !health.groq,
  };

  // When offline, panels are completely hidden (no content without AI/DB)
  const effectiveShowLeft  = showLeft  && !showErrorOverlay;
  const effectiveShowRight = showRight && !showErrorOverlay;

  return (
    <>
      {isLoading && (
        <LoadingScreen onComplete={() => {
          sessionStorage.setItem("argos_v7_loaded", "1");
          setIsLoading(false);
        }} />
      )}
      <CriticalAlertOverlay alerts={alerts ?? []} />

      <AppLayout>
        <div className="flex h-full min-h-0 overflow-hidden">

          {/* ── LEFT — Tension panel ─────────────────────────────────────── */}
          <div className={clsx(
            "relative h-full transition-all duration-300 ease-in-out overflow-hidden shrink-0",
            effectiveShowLeft ? "w-[220px]" : "w-0"
          )}>
            {effectiveShowLeft && <CountryTensionPanel onCountryClick={handleCountryFocus} />}
          </div>

          {/* ── CENTER — Globe ───────────────────────────────────────────── */}
          <div className="relative flex-1 min-w-0 flex flex-col">

            {/* Globe stats bar */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="flex items-center gap-0 rounded-lg px-1 py-1"
                style={{
                  background: "rgba(6,8,16,0.88)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(20px)",
                }}>
                <StatusPill status={serverStatus} />
                <Divider />
                <StatPill value={criticalCount} label="CRIT" color="#F02D3A" pulse />
                <Divider />
                <StatPill value={highCount}     label="HIGH" color="#F59E0B" />
                <Divider />
                <StatPill value={countryCount}  label="CTRY" color="#00C8D4" />
                <Divider />
                <StatPill value={recentAlerts.length} label="48H" color="rgba(255,255,255,0.35)" />
              </div>
            </div>

            {/* Globe */}
            <GlobeView
              focusCountryCode={focusCountry?.code}
              focusLat={focusCountry?.lat}
              focusLng={focusCountry?.lng}
              onToggleBriefing={() => { setRightTab("briefing"); setShowRight(true); }}
              showBriefing={rightTab === "briefing" && showRight}
              onToggleTensions={() => setShowLeft(p => !p)}
              showTensions={showLeft}
              onToggleFeed={() => { setRightTab("feed"); setShowRight(true); }}
              showFeed={rightTab === "feed" && showRight}
            />

            {/* Cinematic error overlay — scoped to globe area only */}
            {showErrorOverlay && (
              <ServerErrorOverlay errors={errorDetails} onRetry={handleRetry} />
            )}

            {/* Bottom toolbar */}
            <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-2 pointer-events-none">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl pointer-events-auto"
                style={{
                  background: "rgba(6,8,16,0.90)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(20px)",
                }}>

                <GlobeToolBtn
                  active={showLeft}
                  onClick={() => setShowLeft(p => !p)}
                  icon={<Map className="w-3.5 h-3.5" />}
                  label="Tensions"
                />
                <ToolDivider />
                <GlobeToolBtn
                  active={rightTab === "feed" && showRight}
                  onClick={() => { setRightTab("feed"); setShowRight(p => rightTab === "feed" ? !p : true); }}
                  icon={<List className="w-3.5 h-3.5" />}
                  label="Alerts"
                />
                <GlobeToolBtn
                  active={rightTab === "briefing" && showRight}
                  onClick={() => { setRightTab("briefing"); setShowRight(p => rightTab === "briefing" ? !p : true); }}
                  icon={<Brain className="w-3.5 h-3.5" />}
                  label="Briefing"
                />
                <ToolDivider />
                <GlobeToolBtn
                  active={!muted}
                  onClick={() => { toggleMute(); setMuted(isMuted()); }}
                  icon={muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  label={muted ? "Muted" : "Sound"}
                />
              </div>
            </div>

            {/* Left panel toggle */}
            <button
              onClick={() => setShowLeft(p => !p)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 h-10 w-4 flex items-center justify-center rounded-r transition-colors"
              style={{
                background: "rgba(6,8,16,0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderLeft: "none",
              }}>
              {showLeft
                ? <ChevronLeft className="w-2.5 h-2.5 text-white/30" />
                : <ChevronRight className="w-2.5 h-2.5 text-white/30" />}
            </button>

            {/* Right panel toggle */}
            <button
              onClick={() => setShowRight(p => !p)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 h-10 w-4 flex items-center justify-center rounded-l transition-colors"
              style={{
                background: "rgba(6,8,16,0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRight: "none",
              }}>
              {showRight
                ? <ChevronRight className="w-2.5 h-2.5 text-white/30" />
                : <ChevronLeft className="w-2.5 h-2.5 text-white/30" />}
            </button>
          </div>

          {/* ── RIGHT — Tabbed panel (Alerts + Briefing only) ─────────────── */}
          <div className={clsx(
            "relative h-full transition-all duration-300 ease-in-out overflow-hidden shrink-0 flex flex-col",
            effectiveShowRight ? "w-[340px]" : "w-0"
          )} style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
            {effectiveShowRight && (
              <div className="flex flex-col h-full min-h-0 panel-enter"
                style={{ background: "rgba(6,8,16,0.95)" }}>

                {/* Tab bar */}
                <div className="flex shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <TabBtn
                    active={rightTab === "feed"}
                    onClick={() => setRightTab("feed")}
                    icon={<List className="w-3.5 h-3.5" />}
                    label="Alerts"
                    badge={criticalCount > 0 ? String(criticalCount) : undefined}
                    badgeColor="#F02D3A"
                  />
                  <TabBtn
                    active={rightTab === "briefing"}
                    onClick={() => setRightTab("briefing")}
                    icon={<Brain className="w-3.5 h-3.5" />}
                    label="Briefing"
                  />
                </div>

                {/* Tab content */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  {rightTab === "feed" && <AlertFeed />}
                  {rightTab === "briefing" && (
                    <div className="h-full overflow-y-auto scrollbar-thin">
                      <AiSummaryPanel headless />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </AppLayout>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.07)" }} />;
}

function ToolDivider() {
  return <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />;
}

function StatPill({ value, label, color, pulse }: { value: number; label: string; color: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-1 px-2">
      <span className="text-[11px] font-bold font-mono tabular-nums" style={{ color }}>
        {value}
      </span>
      {pulse && value > 0 && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: color }} />
        </span>
      )}
      <span className="text-[8px] font-mono uppercase tracking-wider text-white/25">{label}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2">
      {status === "ok"         && <span className="live-dot live-dot-cyan" style={{ width: 5, height: 5 }} />}
      {status === "connecting" && <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />}
      {status === "error"      && <WifiOff className="w-3 h-3 text-red-500" />}
      <span className={clsx("text-[9px] font-mono uppercase tracking-widest",
        status === "ok" ? "text-[#00C8D4]" : status === "connecting" ? "text-amber-400" : "text-red-500")}>
        {status === "ok" ? "Live" : status === "connecting" ? "Sync" : "Offline"}
      </span>
    </div>
  );
}

function GlobeToolBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-150"
      style={{
        color:      active ? "#00C8D4" : "rgba(255,255,255,0.35)",
        background: active ? "rgba(0,200,212,0.10)" : "transparent",
        border:     active ? "1px solid rgba(0,200,212,0.22)" : "1px solid transparent",
      }}>
      <span style={{ color: active ? "#00C8D4" : "rgba(255,255,255,0.30)" }}>{icon}</span>
      <span className="hidden lg:block">{label}</span>
    </button>
  );
}

function TabBtn({ active, onClick, icon, label, badge, badgeColor }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
  badge?: string; badgeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-all duration-150 relative",
        active ? "text-[#00C8D4]" : "text-white/30 hover:text-white/55"
      )}
      style={active ? { borderBottom: "2px solid #00C8D4" } : { borderBottom: "2px solid transparent" }}>
      <span style={{ color: active ? "#00C8D4" : undefined }}>{icon}</span>
      <span>{label}</span>
      {badge && (
        <span className="text-[8px] font-bold font-mono px-1 py-px rounded"
          style={{ background: `${badgeColor}20`, color: badgeColor, border: `1px solid ${badgeColor}40` }}>
          {badge}
        </span>
      )}
    </button>
  );
}
