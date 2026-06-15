/**
 * Sounds — Argos V7
 * MP3 sounds removed. TTS (SpeechSynthesis) only.
 * Mute state persisted in localStorage.
 */

let muted = false;
let ttsEnabled = true;
try {
  muted      = localStorage.getItem("argos_muted") === "1";
  ttsEnabled = localStorage.getItem("argos_tts")   !== "0";
} catch { /* SSR */ }

export function isMuted()      { return muted; }
export function isTtsEnabled() { return ttsEnabled; }
export function setMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem("argos_muted", v ? "1" : "0"); } catch { /* */ }
}
export function toggleMute() { setMuted(!muted); return muted; }
export function setTtsEnabled(v: boolean) {
  ttsEnabled = v;
  try { localStorage.setItem("argos_tts", v ? "1" : "0"); } catch { /* */ }
}
export function toggleTts() { setTtsEnabled(!ttsEnabled); return ttsEnabled; }

// ── TTS queue ──────────────────────────────────────────────────────────────────
let ttsQueue: string[] = [];
let ttsSpeaking = false;

function drainTts() {
  if (ttsSpeaking || ttsQueue.length === 0) return;
  if (muted || !ttsEnabled) { ttsQueue = []; return; }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  ttsSpeaking = true;
  const text = ttsQueue.shift()!;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang   = "fr-FR";
  utt.rate   = 0.95;
  utt.pitch  = 0.95;
  utt.volume = 0.8;

  const voices = window.speechSynthesis.getVoices();
  const frVoice = voices.find(v => v.lang.startsWith("fr")) ?? null;
  if (frVoice) utt.voice = frVoice;

  utt.onend  = () => { ttsSpeaking = false; setTimeout(drainTts, 300); };
  utt.onerror= () => { ttsSpeaking = false; setTimeout(drainTts, 300); };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

export function speak(text: string) {
  if (muted || !ttsEnabled) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (ttsQueue.length >= 2) ttsQueue = ttsQueue.slice(-1);
  ttsQueue.push(text);
  drainTts();
}

// ── TTS messages ───────────────────────────────────────────────────────────────
function buildTtsMessage(type: string, severity: string, title: string, country?: string | null): string {
  const loc = country ? `en ${country}` : "";
  if (type === "earthquake") {
    const mag = (title.match(/M([\d.]+)/) ?? [])[1];
    return `Séisme ${mag ? `magnitude ${mag} ` : ""}${loc}.`;
  }
  if (type === "tsunami")  return `Alerte tsunami ${loc}. Evacuez les zones côtières.`;
  if (type === "hurricane" || type === "cyclone") return `Cyclone ${loc}. Mesures de protection requises.`;
  if (type === "flood")    return `Inondation ${loc}.`;
  if (type === "wildfire") return `Incendie majeur ${loc}.`;
  if (type === "volcano")  return `Activité volcanique ${loc}.`;
  if (type === "pandemic") return `Alerte pandémie ${loc}.`;
  if (type === "epidemic" || type === "outbreak") return `Foyer épidémique ${loc}.`;
  if (type === "missile")  return `Lancement de missile ${loc}. Alerte critique.`;
  if (type === "airstrike") return `Frappe aérienne ${loc}.`;
  if (type === "nuclear")  return `Alerte nucléaire ${loc}. Niveau maximal.`;
  if (type === "terrorism") return `Attaque terroriste ${loc}.`;
  if (severity === "critical") return `Alerte critique ${loc}.`;
  if (severity === "high")     return `Situation élevée ${loc}.`;
  return "";
}

// ── Public API (no-op stubs for backward compat) ───────────────────────────────
export function playSound(_f: string, _v?: number, _d?: number) {}
export function soundIncoming() {}
export function soundVerifiedCritical() {}
export function soundVerifiedHigh() {}
export function soundVerifiedMedium() {}
export function soundVerifiedLow() {}
export function soundDataRefresh() {}
export function soundMissileLaunch() {}
export function soundMissileImpact() {}
export function soundMultipleLaunches() {}

export function soundVerifiedResult(type: string, severity: string, title = "", country?: string | null) {
  if (severity === "critical" || severity === "high") {
    const msg = buildTtsMessage(type, severity, title, country);
    if (msg) setTimeout(() => speak(msg), 600);
  }
}
