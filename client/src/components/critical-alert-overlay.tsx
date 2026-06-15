/**
 * Critical Alert Overlay — Argos V7
 * Toast-style notifications, bottom-right, max 3 visible, auto-dismiss.
 * Sounds removed — TTS only via browser SpeechSynthesis.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { X, AlertTriangle, Zap } from "lucide-react";
import type { Alert } from "@shared/schema";

const SEV_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "#FF1A3E", bg: "rgba(255,26,62,0.08)",   border: "rgba(255,26,62,0.35)",   label: "CRITIQUE"   },
  high:     { color: "#FFB800", bg: "rgba(255,184,0,0.07)",   border: "rgba(255,184,0,0.30)",   label: "ÉLEVÉ"      },
  medium:   { color: "#00F5FF", bg: "rgba(0,245,255,0.06)",   border: "rgba(0,245,255,0.25)",   label: "MOYEN"      },
  low:      { color: "#666666", bg: "rgba(100,100,100,0.05)", border: "rgba(100,100,100,0.20)", label: "BAS"        },
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

interface Toast {
  id: number;
  alert: Alert;
  entering: boolean;
  exiting: boolean;
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
  utterance.pitch = alert.severity === "critical" ? 0.9 : 1;
  utterance.volume = 0.7;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function CriticalAlertOverlay({ alerts }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seenIds = useRef<Set<number>>(new Set());
  const initialized = useRef(false);
  const toastIdRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

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

    for (const alert of newAlerts.slice(0, 3)) {
      seenIds.current.add(alert.id);
      const id = ++toastIdRef.current;

      setToasts(prev => {
        const next = [...prev.slice(-2), { id, alert, entering: true, exiting: false }];
        return next;
      });

      setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, entering: false } : t));
      }, 50);

      if (alert.severity === "critical") speakAlert(alert);

      setTimeout(() => dismiss(id), alert.severity === "critical" ? 12000 : 8000);
    }

    alerts.forEach(a => seenIds.current.add(a.id));
  }, [alerts, dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-5 z-[200] flex flex-col gap-2 items-end pointer-events-none"
      style={{ maxWidth: 340 }}>
      {toasts.map(toast => {
        const { alert } = toast;
        const meta = SEV_META[alert.severity] ?? SEV_META.low;
        const emoji = TYPE_EMOJIS[alert.type] ?? "⚠️";
        const displayTitle = (alert as any).aiLabel ?? alert.title;

        return (
          <div key={toast.id}
            className={toast.entering ? "toast-enter" : toast.exiting ? "toast-exit" : ""}
            style={{ pointerEvents: "all" }}>
            <div className="rounded-xl backdrop-blur-xl shadow-2xl relative overflow-hidden"
              style={{
                background: `rgba(4,6,12,0.94)`,
                border: `1px solid ${meta.border}`,
                boxShadow: `0 0 24px ${meta.color}22, 0 8px 32px rgba(0,0,0,0.6)`,
                width: 320,
              }}>
              {/* Top severity bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: meta.color }} />

              <div className="px-3 py-2.5 flex items-start gap-2.5">
                {/* Emoji */}
                <span className="text-xl leading-none shrink-0 mt-0.5">{emoji}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[8px] font-black uppercase tracking-widest"
                      style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    {alert.severity === "critical" && (
                      <span className="flex gap-0.5">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-1 h-1 rounded-full"
                            style={{ background: meta.color, animation: `live-ping 0.8s ease-out ${i * 0.15}s infinite` }} />
                        ))}
                      </span>
                    )}
                    <span className="ml-auto text-[7.5px] font-mono text-white/25">
                      {alert.country ?? ""}
                    </span>
                  </div>
                  <p className="text-[10.5px] font-semibold text-white/90 leading-snug line-clamp-2">
                    {displayTitle}
                  </p>
                  {alert.description && (
                    <p className="text-[9px] text-white/40 mt-0.5 line-clamp-1">{alert.description}</p>
                  )}
                </div>

                {/* Dismiss */}
                <button onClick={() => dismiss(toast.id)}
                  className="text-white/20 hover:text-white/60 transition-colors shrink-0 p-0.5 rounded mt-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Bottom: auto-dismiss progress */}
              <div className="h-px mx-3 mb-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{
                  background: meta.color,
                  animation: `${alert.severity === "critical" ? "12" : "8"}s linear forwards`,
                  animationName: "shrink-x",
                  width: "100%",
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
