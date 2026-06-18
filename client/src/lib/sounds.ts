/**
 * Sounds — Argos V7
 * TTS removed. Web Audio API notification beeps only.
 * Mute state persisted in localStorage.
 */

let muted = false;
try {
  muted = localStorage.getItem("argos_muted") === "1";
} catch { /* SSR */ }

export function isMuted()      { return muted; }
export function isTtsEnabled() { return false; }
export function setMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem("argos_muted", v ? "1" : "0"); } catch { /* */ }
}
export function toggleMute() { setMuted(!muted); return muted; }
export function setTtsEnabled(_v: boolean) {}
export function toggleTts() { return false; }
export function speak(_text: string) {}

// ── Web Audio context (lazy) ────────────────────────────────────────────────
let _ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (muted) return null;
  if (typeof window === "undefined" || !("AudioContext" in window || "webkitAudioContext" in window)) return null;
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return null; }
  }
  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

// ── Synthesized beep ─────────────────────────────────────────────────────────
function beep(
  freq: number,
  duration: number,
  volume: number,
  startAt: number,
  type: OscillatorType = "sine"
) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type      = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
    gain.gain.setValueAtTime(0, ctx.currentTime + startAt);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);
    osc.start(ctx.currentTime + startAt);
    osc.stop(ctx.currentTime + startAt + duration + 0.05);
  } catch { /* */ }
}

// ── Critical alert — urgent 3-pulse pattern ──────────────────────────────────
function playCriticalAlert() {
  beep(880, 0.12, 0.35, 0.00, "square");
  beep(660, 0.12, 0.35, 0.18, "square");
  beep(880, 0.15, 0.35, 0.36, "square");
}

// ── High alert — single crisp ping ───────────────────────────────────────────
function playHighAlert() {
  beep(660, 0.18, 0.25, 0.00, "sine");
}

// ── Soft incoming chime ───────────────────────────────────────────────────────
function playIncoming() {
  beep(520, 0.12, 0.18, 0.00, "sine");
}

// ── Public API ───────────────────────────────────────────────────────────────
export function playSound(_f: string, _v?: number, _d?: number) {}
export function soundIncoming() { if (!muted) playIncoming(); }
export function soundVerifiedCritical() { if (!muted) playCriticalAlert(); }
export function soundVerifiedHigh()     { if (!muted) playHighAlert(); }
export function soundVerifiedMedium()   { if (!muted) playIncoming(); }
export function soundVerifiedLow()      {}
export function soundDataRefresh()      {}
export function soundMissileLaunch()    { if (!muted) playCriticalAlert(); }
export function soundMissileImpact()    { if (!muted) playCriticalAlert(); }
export function soundMultipleLaunches() { if (!muted) playCriticalAlert(); }

export function soundVerifiedResult(type: string, severity: string, _title = "", _country?: string | null) {
  if (muted) return;
  if (severity === "critical" || type === "missile" || type === "nuclear") {
    setTimeout(() => soundVerifiedCritical(), 300);
  } else if (severity === "high") {
    setTimeout(() => soundVerifiedHigh(), 300);
  }
}
