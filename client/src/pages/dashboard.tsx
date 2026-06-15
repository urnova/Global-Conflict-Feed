import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import { GlobeView } from "@/components/globe-view";
import { AlertFeed } from "@/components/alert-feed";
import { CountryTensionPanel } from "@/components/country-tension-panel";
import { AiSummaryPanel } from "@/components/ai-summary-panel";
import { LoadingScreen } from "@/components/loading-screen";
import { CriticalAlertOverlay } from "@/components/critical-alert-overlay";
import { MobileDashboard } from "@/components/mobile-dashboard";
import { useAlerts } from "@/hooks/use-alerts";
import { useServerStatus } from "@/hooks/use-server-status";
import { useDeviceType } from "@/hooks/use-mobile";
import {
  Activity, Clock, Brain, Map, List, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, WifiOff, LayoutPanelLeft, MessageSquare
} from "lucide-react";
import { clsx } from "clsx";
import type { Alert } from "@shared/schema";
import { AiChat } from "@/components/ai-chat";

export default function Dashboard() {
  const device = useDeviceType();
  if (device === "mobile" || device === "tablet") return <MobileDashboard />;
  return <DesktopDashboard />;
}

// ── HUD stat chip ──────────────────────────────────────────────────────────────
function StatChip({ label, value, color, pulse }: { label: string; value: number | string; color: string; pulse?: boolean }) {
  return (
    <div className="flex flex-col items-center px-3">
      <div className="flex items-center gap-1">
        <span className="text-xs font-black tabular-nums" style={{ color }}>{value}</span>
        {pulse && value > 0 && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: color }} />
          </span>
        )}
      </div>
      <span className="text-[7px] font-mono uppercase tracking-wider text-white/25 mt-px">{label}</span>
    </div>
  );
}

// ── Desktop ────────────────────────────────────────────────────────────────────
function DesktopDashboard() {
  const { data: alerts } = useAlerts();
  const serverStatus = useServerStatus();

  const [isLoading, setIsLoading] = useState(() =>
    typeof sessionStorage === "undefined" ? true : !sessionStorage.getItem("argos_v7_loaded")
  );
  const [time, setTime] = useState(new Date());
  const [focusCountry, setFocusCountry] = useState<{ code: string; lat?: number; lng?: number } | undefined>();

  // Panel visibility
  const [showTensions, setShowTensions] = useState(true);
  const [showFeed, setShowFeed] = useState(true);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleCountryFocus = useCallback((code: string, lat?: number, lng?: number) => {
    setFocusCountry({ code, lat, lng });
  }, []);

  const H48 = 48 * 60 * 60 * 1000;
  const recentAlerts = (alerts ?? []).filter(a => !a.timestamp || (Date.now() - new Date(a.timestamp).getTime()) < H48);
  const criticalCount = recentAlerts.filter(a => a.severity === "critical").length;
  const highCount = recentAlerts.filter(a => a.severity === "high").length;
  const countryCount = new Set(recentAlerts.map(a => a.countryCode).filter(Boolean)).size;

  const timeStr = time.toLocaleTimeString("fr-FR", {
    timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

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
        <div className="flex h-full overflow-hidden bg-background">

          {/* ── LEFT — Tension panel (collapsible) ───────────────────────── */}
          <div className={clsx("h-full relative z-20 flex transition-all duration-300",
            showTensions ? "w-52" : "w-0")} style={{ overflow: showTensions ? "visible" : "hidden" }}>
            {showTensions && (
              <CountryTensionPanel onCountryClick={handleCountryFocus} onHide={() => setShowTensions(false)} />
            )}
          </div>

          {/* Toggle left panel */}
          <button
            onClick={() => setShowTensions(p => !p)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 h-12 w-4 flex items-center justify-center rounded-r-lg transition-all"
            style={{
              background: "rgba(0,245,255,0.08)",
              border: "1px solid rgba(0,245,255,0.15)",
              borderLeft: "none",
              marginLeft: showTensions ? 208 : 0,
            }}
            title={showTensions ? "Masquer tensions" : "Afficher tensions"}>
            {showTensions
              ? <ChevronLeft className="w-2.5 h-2.5 text-[#00F5FF]/50" />
              : <ChevronRight className="w-2.5 h-2.5 text-[#00F5FF]/50" />}
          </button>

          {/* ── CENTER — Globe + overlays ─────────────────────────────────── */}
          <div className="relative flex-1 min-w-0">
            <GlobeView
              focusCountryCode={focusCountry?.code}
              focusLat={focusCountry?.lat}
              focusLng={focusCountry?.lng}
              onToggleBriefing={() => setShowBriefing(p => !p)}
              showBriefing={showBriefing}
              onToggleTensions={() => setShowTensions(p => !p)}
              showTensions={showTensions}
              onToggleFeed={() => setShowFeed(p => !p)}
              showFeed={showFeed}
            />

            {/* HUD top-center — stats bar */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="hud-bracket flex items-center gap-0 rounded-2xl px-2 py-1.5"
                style={{
                  background: "rgba(4,6,12,0.82)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                }}>
                {/* Status indicator */}
                <div className="flex items-center gap-1.5 px-3">
                  {serverStatus === "ok" && <span className="live-dot live-dot-cyan" style={{ width: 6, height: 6 }} />}
                  {serverStatus === "connecting" && <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />}
                  {serverStatus === "error" && <WifiOff className="w-3 h-3 text-red-500" />}
                  <span className={clsx("text-[8.5px] font-mono uppercase tracking-wider",
                    serverStatus === "ok" ? "text-[#00F5FF]" : serverStatus === "connecting" ? "text-amber-400" : "text-red-500")}>
                    {serverStatus === "ok" ? "Surveillance active" : serverStatus === "connecting" ? "Connexion…" : "Hors ligne"}
                  </span>
                </div>

                <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                <StatChip label="Critiques" value={criticalCount} color="#FF1A3E" pulse />
                <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                <StatChip label="Élevés" value={highCount} color="#FFB800" />
                <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                <StatChip label="Pays" value={countryCount} color="#00F5FF" />
                <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                <StatChip label="Total 48h" value={recentAlerts.length} color="rgba(255,255,255,0.5)" />
              </div>
            </div>

            {/* HUD top-right — clock + sources */}
            <div className="absolute top-3 right-3 z-20 pointer-events-none">
              <div className="rounded-xl px-3 py-2 text-right"
                style={{ background: "rgba(4,6,12,0.82)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00F5FF] justify-end">
                  <Clock className="w-3 h-3" />
                  <span>{timeStr} <span className="text-white/30 text-[8px]">Paris</span></span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 justify-end flex-wrap">
                  {[
                    { label: "GDELT",  color: "#FF6B00" },
                    { label: "NASA",   color: "#FF8800" },
                    { label: "USGS",   color: "#FFAA00" },
                    { label: "RSS",    color: "#FFB800" },
                    { label: "IA",     color: "#AA44FF" },
                  ].map(s => (
                    <span key={s.label} className="text-[7px] font-mono font-bold"
                      style={{ color: s.color }}>{s.label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating action buttons — bottom left of globe */}
            <div className="absolute bottom-8 left-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
              <FabButton
                active={showBriefing}
                onClick={() => setShowBriefing(p => !p)}
                icon={<Brain className="w-3.5 h-3.5" />}
                label="Briefing IA"
              />
              <FabButton
                active={showChat}
                onClick={() => setShowChat(p => !p)}
                icon={<MessageSquare className="w-3.5 h-3.5" />}
                label="Analyste IA"
              />
              <FabButton
                active={showTensions}
                onClick={() => setShowTensions(p => !p)}
                icon={<Map className="w-3.5 h-3.5" />}
                label="Tensions"
              />
              <FabButton
                active={showFeed}
                onClick={() => setShowFeed(p => !p)}
                icon={<List className="w-3.5 h-3.5" />}
                label="Flux alertes"
              />
            </div>

            {/* Floating briefing panel — overlaid on globe */}
            {showBriefing && (
              <div className="absolute top-16 left-4 z-20 w-72 pointer-events-auto"
                style={{ maxHeight: "calc(100% - 5rem)" }}>
                <div className="rounded-xl overflow-hidden h-full flex flex-col"
                  style={{ background: "rgba(4,6,12,0.92)", border: "1px solid rgba(0,245,255,0.18)", backdropFilter: "blur(20px)", maxHeight: "70vh" }}>
                  <div className="flex items-center justify-between px-3 py-2 shrink-0"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-[#00F5FF]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#00F5FF]">Briefing Stratégique</span>
                    </div>
                    <button onClick={() => setShowBriefing(false)} className="text-white/20 hover:text-white/60 transition-colors text-xs p-1 rounded">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <AiSummaryPanel headless />
                  </div>
                </div>
              </div>
            )}

            {/* AI Chat panel */}
            {showChat && (
              <div className="absolute top-16 left-4 z-20 w-80 pointer-events-auto"
                style={{ maxHeight: "calc(100% - 5rem)" }}>
                <div className="rounded-xl overflow-hidden flex flex-col"
                  style={{ height: "70vh", background: "rgba(4,6,12,0.92)", border: "1px solid rgba(170,68,255,0.25)", backdropFilter: "blur(20px)" }}>
                  <div className="flex items-center justify-between px-3 py-2 shrink-0"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-violet-400">Analyste IA</span>
                    </div>
                    <button onClick={() => setShowChat(false)} className="text-white/20 hover:text-white/60 transition-colors text-xs p-1 rounded">✕</button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <AiChat />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom center hint */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <span className="text-[7.5px] font-mono text-white/15 uppercase tracking-widest">
                Cliquer pays · Cliquer point · FAB = panneaux
              </span>
            </div>
          </div>

          {/* ── RIGHT — Alert feed (collapsible) ─────────────────────────── */}
          {showFeed && (
            <div className="h-full z-20 flex-shrink-0">
              <AlertFeed onHide={() => setShowFeed(false)} />
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}

function FabButton({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-200 group"
      style={{
        background: active ? "rgba(0,245,255,0.12)" : "rgba(4,6,12,0.75)",
        border: `1px solid ${active ? "rgba(0,245,255,0.3)" : "rgba(255,255,255,0.08)"}`,
        backdropFilter: "blur(12px)",
        color: active ? "#00F5FF" : "rgba(255,255,255,0.35)",
        boxShadow: active ? "0 0 12px rgba(0,245,255,0.12)" : "none",
      }}>
      <span className={active ? "text-[#00F5FF]" : "text-white/35"}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
