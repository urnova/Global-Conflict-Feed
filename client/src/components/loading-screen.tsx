import { useEffect, useState } from "react";

const STEPS = [
  { label: "Initialisation des capteurs orbitaux",     pct: 12 },
  { label: "Connexion au flux de données global",       pct: 28 },
  { label: "Synchronisation constellation satellite",   pct: 45 },
  { label: "Déchiffrement flux de renseignement",       pct: 62 },
  { label: "Cartographie des zones actives",            pct: 78 },
  { label: "Chargement du moteur d'analyse IA",         pct: 90 },
  { label: "Système opérationnel",                      pct: 100 },
];

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let step = 0;
    const advance = () => {
      if (step >= STEPS.length - 1) {
        setPct(100);
        setDone(true);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(onComplete, 600);
        }, 700);
        return;
      }
      step++;
      setStepIdx(step);
      setPct(STEPS[step].pct);
      const delay = step < STEPS.length - 1 ? 380 + Math.random() * 260 : 500;
      setTimeout(advance, delay);
    };
    const t = setTimeout(advance, 300);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black"
      style={{
        transition: "opacity 0.6s ease",
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? "none" : "all",
      }}
    >
      {/* Ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.08) 0%, transparent 70%)" }} />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,0.015) 2px, rgba(0,245,255,0.015) 4px)" }} />

      <div className="w-full max-w-sm px-6 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(0,245,255,0.15) 0%, transparent 70%)" }} />
          <img src="/argos.svg" alt="ARGOS" className="h-20 w-auto relative z-10 opacity-90" />
        </div>

        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="text-[11px] font-black font-mono uppercase tracking-[0.4em] text-white/70">
            Argos Intelligence
          </div>
          <div className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/25">
            Analyse Radar Globale · Observation Situations
          </div>
        </div>

        {/* Progress block */}
        <div className="w-full space-y-3">
          {/* Status line */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-[#00F5FF]/70 cursor-blink">
              {STEPS[stepIdx].label}
            </span>
            <span className="text-[9px] font-mono text-[#00F5FF]/50 tabular-nums">
              {pct}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-px w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, rgba(0,245,255,0.4) 0%, #00F5FF 100%)",
                boxShadow: "0 0 8px rgba(0,245,255,0.5)",
              }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex gap-1 justify-center">
            {STEPS.map((_, i) => (
              <div key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === stepIdx ? 16 : 4,
                  height: 3,
                  background: i <= stepIdx ? "#00F5FF" : "rgba(255,255,255,0.08)",
                  opacity: i === stepIdx ? 1 : i < stepIdx ? 0.5 : 0.2,
                }} />
            ))}
          </div>
        </div>

        {/* Feature badges */}
        <div className="flex gap-2 flex-wrap justify-center">
          {["SÉCURISÉ", "DIRECT", "GLOBAL"].map((label, i) => {
            const icons = ["🔒", "⚡", "🌐"];
            const active = stepIdx >= (i + 1) * 2;
            return (
              <div key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-500"
                style={{
                  border: `1px solid ${active ? "rgba(0,245,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                  background: active ? "rgba(0,245,255,0.07)" : "rgba(255,255,255,0.03)",
                  opacity: active ? 1 : 0.4,
                }}>
                <span className="text-sm leading-none">{icons[i]}</span>
                <span className="text-[8px] font-mono font-bold uppercase tracking-widest"
                  style={{ color: active ? "#00F5FF" : "rgba(255,255,255,0.3)" }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Done */}
        {done && (
          <div className="text-[9px] font-mono uppercase tracking-[0.3em] fade-up"
            style={{ color: "#00F5FF" }}>
            Système prêt ✓
          </div>
        )}
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-6 text-[7px] font-mono text-white/15 uppercase tracking-[0.3em]">
        Astral Defense Systems · V7.0
      </div>
    </div>
  );
}
