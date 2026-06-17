/**
 * CriticalAlertOverlay — Argos V7
 * Bandeau centré EN HAUT, sous la navbar.
 * Une alerte à la fois, navigation prev/next, auto-dismiss, TTS.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, AlertTriangle, Zap } from "lucide-react";
import type { Alert } from "@shared/schema";

const SEV_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "#FF1A3E", bg: "rgba(255,26,62,0.08)",   border: "rgba(255,26,62,0.30)",  label: "CRITIQUE" },
  high:     { color: "#FFB800", bg: "rgba(255,184,0,0.07)",   border: "rgba(255,184,0,0.25)",  label: "ÉLEVÉ"    },
  medium:   { color: "#00C8D4", bg: "rgba(0,200,212,0.06)",   border: "rgba(0,200,212,0.20)",  label: "MOYEN"    },
  low:      { color: "#555555", bg: "rgba(100,100,100,0.04)", border: "rgba(100,100,100,0.15)", label: "BAS"     },
};

const TYPE_EMOJIS: Record<string, string> = {
  missile:"🚀", airstrike:"✈️", artillery:"💣", naval:"⚓",
  conflict:"⚔️", explosion:"💥", chemical:"☣️", nuclear:"☢️",
  cyber:"💻", massacre:"💀", terrorism:"🔴", coup:"⚖️",
  earthquake:"🌍", tsunami:"🌊", volcano:"🌋", flood:"💧",
  wildfire:"🔥", hurricane:"🌀", cyclone:"🌀", tornado:"🌪️",
  storm:"⛈️", heatwave:"🌡️", pandemic:"🦠", epidemic:"🦠",
  outbreak:"🦠", diplomatic:"🤝", political:"🏛️", sanctions:"🚫",
  protest:"📢", humanitarian:"🆘", breaking:"📡", warning:"⚠️", info:"ℹ️",
};

interface QueuedAlert {
  id: number;
  alert: Alert;
}

interface Props { alerts: Alert[] }

function speakAlert(alert: Alert) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if ((window as any).__argos_tts_muted) return;
  const label = (alert as any).aiLabel ?? alert.title;
  const sev = alert.severity === "critical" ? "ALERTE CRITIQUE" : "ALERTE";
  const utterance = new SpeechSynthesisUtterance(`${sev}. ${label}`);
  utterance.lang = "fr-FR";
  utterance.rate = 1.1;
  utterance.pitch = alert.severity === "critical" ? 0.85 : 1;
  utterance.volume = 0.7;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function CriticalAlertOverlay({ alerts }: Props) {
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const seenIds = useRef<Set<number>>(new Set());
  const initialized = useRef(false);
  const idRef = useRef(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (dismissTimer.current) { clearTimeout(dismissTimer.current); dismissTimer.current = null; }
  };

  const dismissAll = useCallback(() => {
    clearTimer();
    setExiting(true);
    setTimeout(() => {
      setQueue([]);
      setIdx(0);
      setVisible(false);
      setExiting(false);
    }, 350);
  }, []);

  const dismiss = useCallback((removeId?: number) => {
    clearTimer();
    setQueue(prev => {
      const next = removeId !== undefined
        ? prev.filter(q => q.id !== removeId)
        : prev.slice(1);
      if (next.length === 0) {
        setExiting(true);
        setTimeout(() => { setVisible(false); setExiting(false); setIdx(0); }, 350);
      } else {
        setIdx(i => Math.min(i, next.length - 1));
      }
      return next;
    });
  }, []);

  // Start auto-dismiss timer for current alert
  const startTimer = useCallback((durationMs: number) => {
    clearTimer();
    dismissTimer.current = setTimeout(() => dismiss(), durationMs);
  }, [dismiss]);

  useEffect(() => {
    if (alerts.length === 0) return;
    if (!initialized.current) {
      alerts.forEach(a => seenIds.current.add(a.id));
      initialized.current = true;
      return;
    }

    const newAlerts = alerts.filter(a =>
      !seenIds.current.has(a.id) &&
      a.aiVerified === true &&
      (a.severity === "critical" || a.severity === "high")
    );

    if (newAlerts.length === 0) {
      alerts.forEach(a => seenIds.current.add(a.id));
      return;
    }

    for (const alert of newAlerts.slice(0, 5)) {
      seenIds.current.add(alert.id);
      const id = ++idRef.current;
      setQueue(prev => [...prev, { id, alert }]);
    }
    alerts.forEach(a => seenIds.current.add(a.id));

    // Speak first new critical alert
    const firstCrit = newAlerts.find(a => a.severity === "critical");
    if (firstCrit) speakAlert(firstCrit);
  }, [alerts]);

  // Show banner when queue is non-empty
  useEffect(() => {
    if (queue.length > 0 && !visible) {
      setVisible(true);
      setExiting(false);
      setIdx(0);
    }
  }, [queue.length, visible]);

  // Restart timer when idx changes
  useEffect(() => {
    if (!visible || queue.length === 0) return;
    const current = queue[Math.min(idx, queue.length - 1)];
    if (!current) return;
    startTimer(current.alert.severity === "critical" ? 14000 : 9000);
    return () => clearTimer();
  }, [idx, visible, queue, startTimer]);

  if (!visible || queue.length === 0) return null;

  const safeIdx = Math.min(idx, queue.length - 1);
  const current = queue[safeIdx];
  if (!current) return null;

  const { alert } = current;
  const meta = SEV_META[alert.severity] ?? SEV_META.low;
  const displayTitle = (alert as any).aiLabel ?? alert.title;
  const isCritical = alert.severity === "critical";

  return (
    <div
      className="fixed z-[500] pointer-events-none"
      style={{
        top: 48,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(520px, calc(100vw - 2rem))",
      }}
    >
      <div
        className="pointer-events-auto"
        style={{
          animation: exiting
            ? "alert-banner-out 0.35s cubic-bezier(0.4,0,1,1) forwards"
            : "alert-banner-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
      >
        <div
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: "rgba(4,6,14,0.97)",
            border: `1px solid ${meta.border}`,
            backdropFilter: "blur(24px) saturate(1.6)",
            boxShadow: `0 0 0 1px ${meta.color}18, 0 8px 40px rgba(0,0,0,0.7), 0 0 40px ${meta.color}15`,
          }}
        >
          {/* Top accent bar */}
          <div className="h-0.5" style={{
            background: isCritical
              ? `linear-gradient(90deg, ${meta.color}, ${meta.color}80, transparent)`
              : `linear-gradient(90deg, ${meta.color}80, transparent)`,
          }} />

          <div className="px-4 py-3 flex items-center gap-3">
            {/* Severity icon */}
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}35` }}>
              {isCritical
                ? <AlertTriangle className="w-4 h-4" style={{ color: meta.color }} />
                : <Zap className="w-4 h-4" style={{ color: meta.color }} />
              }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] font-black uppercase tracking-widest"
                  style={{ color: meta.color }}>
                  {meta.label}
                </span>
                {alert.country && (
                  <span className="text-[8px] font-mono text-white/30 flex items-center gap-1">
                    {alert.countryCode && alert.countryCode.length === 2 && (
                      <img
                        src={`https://flagcdn.com/16x12/${alert.countryCode.toLowerCase()}.png`}
                        alt=""
                        className="w-3.5 h-2.5 rounded-sm opacity-60"
                      />
                    )}
                    {alert.country}
                  </span>
                )}
                {queue.length > 1 && (
                  <span className="ml-auto text-[8px] font-mono font-bold px-1.5 py-px rounded"
                    style={{ background: `${meta.color}18`, color: `${meta.color}80` }}>
                    {safeIdx + 1}/{queue.length}
                  </span>
                )}
              </div>
              <p className="text-[12px] font-bold text-white/90 leading-snug line-clamp-2">
                {displayTitle}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              {queue.length > 1 && (
                <>
                  <button
                    onClick={() => { clearTimer(); setIdx(i => Math.max(0, i - 1)); }}
                    disabled={safeIdx === 0}
                    className="p-1.5 rounded-md transition-all disabled:opacity-20"
                    style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.04)" }}
                    title="Alerte précédente">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { clearTimer(); setIdx(i => Math.min(queue.length - 1, i + 1)); }}
                    disabled={safeIdx === queue.length - 1}
                    className="p-1.5 rounded-md transition-all disabled:opacity-20"
                    style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.04)" }}
                    title="Alerte suivante">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={dismissAll}
                className="p-1.5 rounded-md transition-all hover:text-white/80"
                style={{ color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)" }}
                title="Ignorer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Auto-dismiss progress bar */}
          <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              key={`${current.id}-${safeIdx}`}
              className="h-full"
              style={{
                background: meta.color,
                animation: `shrink-width ${isCritical ? "14s" : "9s"} linear forwards`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
