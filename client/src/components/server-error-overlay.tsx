/**
 * ServerErrorOverlay — Argos V7
 * Displayed over the globe when the server / DB / API is unreachable.
 * The globe still renders behind it (frozen), giving a dramatic "system failure" effect.
 */

import { useEffect, useState } from "react";
import { WifiOff, Database, AlertOctagon, RefreshCw } from "lucide-react";

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
  const [pulse, setPulse] = useState(true);
  const [tick, setTick]   = useState(0);

  // Blink every 800ms for the edge effect
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 800);
    return () => clearInterval(id);
  }, []);

  // Elapsed counter
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const issues: string[] = [];
  if (errors.server) issues.push("SERVER UNREACHABLE");
  else {
    if (errors.db)   issues.push("DATABASE OFFLINE");
    if (errors.groq) issues.push("AI ENGINE OFFLINE");
  }

  if (issues.length === 0) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden pointer-events-none">

      {/* Dark desaturation overlay */}
      <div className="absolute inset-0" style={{
        background: "rgba(2,3,8,0.72)",
        backdropFilter: "grayscale(0.6) brightness(0.55)",
      }} />

      {/* Red corner vignette — pulsing */}
      <div className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: pulse ? 1 : 0.45,
          background: `
            radial-gradient(ellipse at top left,    rgba(255,0,40,0.22) 0%, transparent 45%),
            radial-gradient(ellipse at top right,   rgba(255,0,40,0.22) 0%, transparent 45%),
            radial-gradient(ellipse at bottom left, rgba(255,0,40,0.18) 0%, transparent 45%),
            radial-gradient(ellipse at bottom right,rgba(255,0,40,0.18) 0%, transparent 45%)
          `,
        }} />

      {/* Edge scanline sweep */}
      <style>{`
        @keyframes err-scan {
          0%   { top: -2px; opacity: 0.7; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes err-flicker {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.82; }
        }
        @keyframes err-fade-in {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1);    }
        }
      `}</style>
      <div className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,30,60,0.7), transparent)",
          boxShadow: "0 0 8px rgba(255,30,60,0.8)",
          animation: "err-scan 3.5s linear infinite",
        }} />

      {/* Corner brackets */}
      {[
        { top: 16, left: 16,   border: "border-t border-l" },
        { top: 16, right: 16,  border: "border-t border-r" },
        { bottom: 16, left: 16,  border: "border-b border-l" },
        { bottom: 16, right: 16, border: "border-b border-r" },
      ].map((pos, i) => (
        <div key={i} className={`absolute w-8 h-8 ${pos.border} transition-opacity duration-700`}
          style={{
            ...pos as any,
            borderColor: pulse ? "rgba(255,30,60,0.7)" : "rgba(255,30,60,0.3)",
          }} />
      ))}

      {/* Main card */}
      <div
        className="relative pointer-events-auto"
        style={{ animation: "err-fade-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(4,5,12,0.95)",
            border: `1px solid rgba(255,30,60,${pulse ? "0.50" : "0.28"})`,
            backdropFilter: "blur(28px)",
            boxShadow: `
              0 0 0 1px rgba(255,30,60,0.08),
              0 0 60px rgba(255,30,60,0.18),
              0 24px 60px rgba(0,0,0,0.8)
            `,
            transition: "border-color 0.7s",
            animation: "err-flicker 2s ease-in-out infinite",
          }}
        >
          {/* Top accent */}
          <div className="h-0.5 w-full" style={{
            background: `linear-gradient(90deg, transparent, rgba(255,30,60,${pulse ? "0.9" : "0.5"}), transparent)`,
            transition: "opacity 0.7s",
          }} />

          <div className="px-8 py-7 flex flex-col items-center gap-5 min-w-[320px]">

            {/* Icon */}
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{
                background: "rgba(255,30,60,0.10)",
                border: `1px solid rgba(255,30,60,${pulse ? "0.45" : "0.22"})`,
                transition: "border-color 0.7s",
              }}>
              <AlertOctagon className="w-8 h-8" style={{ color: `rgba(255,30,60,${pulse ? "1" : "0.7"})`, transition: "color 0.7s" }} />
              {/* Ping ring */}
              <div className="absolute inset-0 rounded-2xl animate-ping"
                style={{ border: "1px solid rgba(255,30,60,0.25)", animationDuration: "2s" }} />
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.35em] text-red-500/80">
                System Critical
              </div>
              <div className="text-[22px] font-black uppercase tracking-widest text-white/90 leading-none">
                {errors.server ? "SERVER ERROR" : "PARTIAL FAILURE"}
              </div>
              <div className="text-[9px] font-mono text-white/25 tracking-wider">
                ARGOS INTELLIGENCE · FAULT CODE 0x{tick.toString(16).toUpperCase().padStart(4, "0")}
              </div>
            </div>

            {/* Issue list */}
            <div className="w-full space-y-2">
              {issues.map((issue, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: "rgba(255,30,60,0.07)", border: "1px solid rgba(255,30,60,0.15)" }}>
                  {issue.includes("DATABASE")
                    ? <Database className="w-3.5 h-3.5 shrink-0 text-red-400" />
                    : issue.includes("AI")
                    ? <span className="text-sm leading-none shrink-0">🤖</span>
                    : <WifiOff className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  }
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">
                    {issue}
                  </span>
                  <span className="ml-auto">
                    <span className="inline-flex w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "rgba(255,30,60,0.8)" }} />
                  </span>
                </div>
              ))}
            </div>

            {/* Sub-message */}
            <p className="text-center text-[10px] font-mono text-white/25 leading-relaxed max-w-[260px]">
              {errors.server
                ? "Unable to reach the Argos server. Verify your connection or wait for the service to resume."
                : "Some systems are degraded. Core monitoring continues with reduced capabilities."}
            </p>

            {/* Retry */}
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "rgba(255,30,60,0.10)",
                  border: "1px solid rgba(255,30,60,0.30)",
                  color: "rgba(255,80,80,0.9)",
                }}>
                <RefreshCw className="w-3 h-3" />
                Retry Connection
              </button>
            )}
          </div>

          {/* Bottom accent */}
          <div className="h-0.5 w-full" style={{
            background: `linear-gradient(90deg, transparent, rgba(255,30,60,${pulse ? "0.5" : "0.2"}), transparent)`,
            transition: "opacity 0.7s",
          }} />
        </div>
      </div>
    </div>
  );
}
