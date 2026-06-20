/**
 * ServerErrorOverlay — Argos V7
 * Full-screen cinematic sci-fi "SIGNAL LOST" overlay.
 * Covers entire app when any service (Groq / DB / server) is offline.
 */

import { useEffect, useState } from "react";
import { WifiOff, Database, Brain, RefreshCw, Radio, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

interface ErrorDetail {
  db: boolean;
  groq: boolean;
  server: boolean;
}

interface Props {
  errors: ErrorDetail;
  onRetry?: () => void;
}

export function ServerErrorOverlay({ errors, onRetry }: Props) {
  const [blink, setBlink]     = useState(true);
  const [tick,  setTick]      = useState(0);
  const [scan,  setScan]      = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBlink(v => !v), 700);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setScan(v => (v + 1) % 101), 25);
    return () => clearInterval(t);
  }, []);

  const services = [
    { id: "server", label: "SERVER",     ok: !errors.server, icon: <Radio      className="w-3 h-3" /> },
    { id: "db",     label: "DATABASE",   ok: !errors.db,     icon: <Database   className="w-3 h-3" /> },
    { id: "groq",   label: "AI ENGINE",  ok: !errors.groq,   icon: <Brain      className="w-3 h-3" /> },
  ];

  const offlineServices = services.filter(s => !s.ok);
  if (offlineServices.length === 0) return null;

  const faultCode = tick.toString(16).toUpperCase().padStart(4, "0");

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto select-none">

      {/* ── Dark backdrop ─────────────────────────────────────────────────── */}
      <div className="absolute inset-0"
        style={{ background: "rgba(2,3,10,0.92)" }} />

      {/* ── CRT scan-line texture ─────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)",
        }} />

      {/* ── Moving scan beam ─────────────────────────────────────────────── */}
      <div
        className="absolute left-0 right-0 h-0.5 pointer-events-none"
        style={{
          top: `${scan}%`,
          background:
            "linear-gradient(90deg, transparent, rgba(220,38,38,0.18) 30%, rgba(220,38,38,0.35) 50%, rgba(220,38,38,0.18) 70%, transparent)",
          boxShadow: "0 0 8px rgba(220,38,38,0.3)",
        }}
      />

      {/* ── Red corner vignette ───────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: blink ? 1 : 0.4,
          background: `
            radial-gradient(ellipse at top left,    rgba(200,0,30,0.28) 0%, transparent 48%),
            radial-gradient(ellipse at top right,   rgba(200,0,30,0.28) 0%, transparent 48%),
            radial-gradient(ellipse at bottom left, rgba(200,0,30,0.22) 0%, transparent 48%),
            radial-gradient(ellipse at bottom right,rgba(200,0,30,0.22) 0%, transparent 48%)
          `,
        }}
      />

      {/* ── Left blinking border + glow ──────────────────────────────────── */}
      <div className="absolute left-0 top-0 bottom-0 w-1 pointer-events-none transition-all duration-700"
        style={{
          background: blink
            ? "linear-gradient(180deg, transparent 0%, #dc2626 20%, #dc2626 80%, transparent 100%)"
            : "linear-gradient(180deg, transparent 0%, #7f1d1d 20%, #7f1d1d 80%, transparent 100%)",
          boxShadow: blink ? "0 0 18px 4px rgba(220,38,38,0.55)" : "none",
        }}
      />
      <div className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: blink ? 1 : 0,
          background: "linear-gradient(90deg, rgba(220,38,38,0.14) 0%, transparent 100%)",
        }}
      />

      {/* ── Right blinking border + glow ─────────────────────────────────── */}
      <div className="absolute right-0 top-0 bottom-0 w-1 pointer-events-none transition-all duration-700"
        style={{
          background: blink
            ? "linear-gradient(180deg, transparent 0%, #dc2626 20%, #dc2626 80%, transparent 100%)"
            : "linear-gradient(180deg, transparent 0%, #7f1d1d 20%, #7f1d1d 80%, transparent 100%)",
          boxShadow: blink ? "0 0 18px 4px rgba(220,38,38,0.55)" : "none",
        }}
      />
      <div className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: blink ? 1 : 0,
          background: "linear-gradient(270deg, rgba(220,38,38,0.14) 0%, transparent 100%)",
        }}
      />

      {/* ── Top/Bottom border flashes ────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none transition-all duration-700"
        style={{
          background: blink
            ? "linear-gradient(90deg, transparent, rgba(220,38,38,0.9), transparent)"
            : "linear-gradient(90deg, transparent, rgba(100,0,0,0.4), transparent)",
          boxShadow: blink ? "0 0 8px rgba(220,38,38,0.4)" : "none",
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none transition-all duration-700"
        style={{
          background: blink
            ? "linear-gradient(90deg, transparent, rgba(220,38,38,0.9), transparent)"
            : "linear-gradient(90deg, transparent, rgba(100,0,0,0.4), transparent)",
          boxShadow: blink ? "0 0 8px rgba(220,38,38,0.4)" : "none",
        }}
      />

      {/* ── Corner brackets ───────────────────────────────────────────────── */}
      {[
        { style: { top: 16, left: 16 },   cls: "border-t-2 border-l-2" },
        { style: { top: 16, right: 16 },  cls: "border-t-2 border-r-2" },
        { style: { bottom: 16, left: 16 }, cls: "border-b-2 border-l-2" },
        { style: { bottom: 16, right: 16 }, cls: "border-b-2 border-r-2" },
      ].map((c, i) => (
        <div key={i} className={`absolute w-7 h-7 ${c.cls} pointer-events-none transition-all duration-700`}
          style={{
            ...c.style,
            borderColor: blink ? "rgba(220,38,38,0.7)" : "rgba(180,0,0,0.3)",
          }} />
      ))}

      {/* ── Top HUD labels ────────────────────────────────────────────────── */}
      <div className="absolute top-5 left-12 flex items-center gap-1.5 pointer-events-none">
        <AlertTriangle className={clsx("w-3 h-3 transition-colors duration-700", blink ? "text-red-500" : "text-red-900")} />
        <span className="text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-red-600/60">
          SYSTEM OFFLINE
        </span>
      </div>
      <div className="absolute top-5 right-12 pointer-events-none">
        <span className="text-[8px] font-mono text-red-700/40 tracking-widest">
          FAULT·0x{faultCode}
        </span>
      </div>

      {/* ── Main centered content ─────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 px-6 max-w-md w-full text-center">

          {/* Warning icon with ping */}
          <div className="relative">
            <div className={clsx(
              "w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-700",
              blink
                ? "border-red-500 shadow-[0_0_40px_10px_rgba(220,38,38,0.35)]"
                : "border-red-900"
            )}>
              <WifiOff className={clsx(
                "w-9 h-9 transition-colors duration-700",
                blink ? "text-red-400" : "text-red-900"
              )} />
            </div>
            <div className="absolute inset-0 rounded-full border border-red-500/25 animate-ping" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className={clsx("w-1.5 h-1.5 rounded-full transition-colors duration-700", blink ? "bg-red-400" : "bg-red-900")} />
              <span className="text-[9px] font-mono font-bold uppercase tracking-[0.35em] text-red-500/60">
                Argos Intelligence V7
              </span>
              <div className={clsx("w-1.5 h-1.5 rounded-full transition-colors duration-700", blink ? "bg-red-400" : "bg-red-900")} />
            </div>

            <h1 className={clsx(
              "text-5xl font-black font-mono uppercase tracking-[0.12em] leading-none transition-all duration-700",
              blink ? "text-red-400" : "text-red-800"
            )}>
              SIGNAL
            </h1>
            <h1 className={clsx(
              "text-5xl font-black font-mono uppercase tracking-[0.12em] leading-none transition-all duration-700",
              blink ? "text-red-400" : "text-red-800"
            )}>
              LOST
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-500/40 mt-1">
              ── ERROR BROADCAST ──
            </p>
          </div>

          {/* Separator */}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(220,38,38,0.4))" }} />
            <div className="w-1 h-1 rounded-full bg-red-700/60" />
            <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, transparent, rgba(220,38,38,0.4))" }} />
          </div>

          {/* Service status pills */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            {services.map(s => (
              <div key={s.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-700"
                style={{
                  background: s.ok ? "rgba(0,180,80,0.08)" : "rgba(220,38,38,0.10)",
                  borderColor: s.ok
                    ? "rgba(0,180,80,0.25)"
                    : (blink ? "rgba(220,38,38,0.5)" : "rgba(140,0,0,0.3)"),
                }}>
                <span style={{ color: s.ok ? "#22c55e" : (blink ? "#f87171" : "#7f1d1d"), transition: "color 0.7s" }}>
                  {s.icon}
                </span>
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider transition-colors duration-700"
                  style={{ color: s.ok ? "#22c55e" : (blink ? "#fca5a5" : "#7f1d1d") }}>
                  {s.label}
                </span>
                <span className="text-[7px] font-mono uppercase tracking-widest"
                  style={{ color: s.ok ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.45)" }}>
                  {s.ok ? "OK" : "OFFLINE"}
                </span>
              </div>
            ))}
          </div>

          {/* Descriptions */}
          <div className="space-y-1">
            {offlineServices.map(s => (
              <p key={s.id} className="text-[9px] font-mono text-white/20 leading-relaxed">
                {s.id === "groq"   && "› AI Engine key not configured — intelligence generation suspended"}
                {s.id === "db"     && "› Database connection lost — all data feeds unavailable"}
                {s.id === "server" && "› Server unreachable — all transmissions offline"}
              </p>
            ))}
          </div>

          {/* Retry */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
              style={{
                background: "rgba(220,38,38,0.10)",
                borderColor: "rgba(220,38,38,0.35)",
                color: "#f87171",
              }}>
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          )}

          {/* Bottom ticker */}
          <p className="text-[8px] font-mono text-white/12 uppercase tracking-[0.22em]">
            {blink ? "▮" : "▯"}&nbsp;&nbsp;All transmissions suspended · Awaiting reconnection&nbsp;&nbsp;{blink ? "▮" : "▯"}
          </p>

        </div>
      </div>
    </div>
  );
}
