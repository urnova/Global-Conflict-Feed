/**
 * Sound Manager + TTS — Argos Intelligence V7
 *
 * Deux canaux séparés :
 *   1. Sons préenregistrés (mp3) — queue séquentielle
 *   2. TTS (SpeechSynthesis) — alertes critiques françaises
 *
 * TTS activé pour : critical + high severity
 * Sons préenregistrés pour tout
 */

// ── État global ────────────────────────────────────────────────────────────────
let muted = false;
let ttsEnabled = true;
try {
  muted = localStorage.getItem('argos_muted') === '1';
  ttsEnabled = localStorage.getItem('argos_tts') !== '0';
} catch { /* SSR */ }

export function isMuted() { return muted; }
export function setMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem('argos_muted', v ? '1' : '0'); } catch { /* */ }
}
export function toggleMute() { setMuted(!muted); return muted; }

export function isTtsEnabled() { return ttsEnabled; }
export function setTtsEnabled(v: boolean) {
  ttsEnabled = v;
  try { localStorage.setItem('argos_tts', v ? '1' : '0'); } catch { /* */ }
}
export function toggleTts() { setTtsEnabled(!ttsEnabled); return ttsEnabled; }

// ── Queue sons préenregistrés ──────────────────────────────────────────────────
const queue: Array<[string, number, number]> = [];
let playing = false;

function drainQueue() {
  if (playing || queue.length === 0) return;
  if (muted) { queue.length = 0; return; }
  playing = true;
  const [filename, volume, delay] = queue.shift()!;
  setTimeout(() => {
    try {
      const audio = new Audio(`/sounds/${filename}`);
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.play().catch(() => {});
      audio.addEventListener('ended', () => { playing = false; drainQueue(); });
      setTimeout(() => { if (playing) { playing = false; drainQueue(); } }, 5000);
    } catch {
      playing = false;
      setTimeout(drainQueue, 100);
    }
  }, delay);
}

export function playSound(filename: string, volume = 0.7, delay = 0) {
  if (muted) return;
  if (queue.length >= 5) queue.splice(0, queue.length - 4);
  queue.push([filename, volume, delay]);
  if (!playing) drainQueue();
}

// ── TTS (SpeechSynthesis) ──────────────────────────────────────────────────────
let ttsQueue: string[] = [];
let ttsSpeaking = false;

function drainTts() {
  if (ttsSpeaking || ttsQueue.length === 0) return;
  if (muted || !ttsEnabled) { ttsQueue = []; return; }
  if (!('speechSynthesis' in window)) return;

  ttsSpeaking = true;
  const text = ttsQueue.shift()!;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'fr-FR';
  utt.rate = 0.92;
  utt.pitch = 0.95;
  utt.volume = 0.85;

  // Prefer a French voice if available
  const voices = window.speechSynthesis.getVoices();
  const frVoice = voices.find(v => v.lang.startsWith('fr')) ?? null;
  if (frVoice) utt.voice = frVoice;

  utt.onend = () => { ttsSpeaking = false; setTimeout(drainTts, 200); };
  utt.onerror = () => { ttsSpeaking = false; setTimeout(drainTts, 200); };

  window.speechSynthesis.speak(utt);
}

export function speak(text: string) {
  if (muted || !ttsEnabled) return;
  if (!('speechSynthesis' in window)) return;
  if (ttsQueue.length >= 3) ttsQueue = ttsQueue.slice(-2);
  ttsQueue.push(text);
  drainTts();
}

// ── TTS messages par type/sévérité ────────────────────────────────────────────
function buildTtsMessage(type: string, severity: string, title: string, country?: string | null): string {
  const loc = country ? `en ${country}` : '';

  // Catastrophes naturelles
  if (type === 'earthquake') {
    const magMatch = title.match(/M([\d.]+)/);
    const mag = magMatch ? `, magnitude ${magMatch[1]}` : '';
    return `Séisme détecté ${loc}${mag}.`;
  }
  if (type === 'tsunami') return `Alerte tsunami ${loc}. Evacuez les zones côtières.`;
  if (type === 'hurricane' || type === 'cyclone') return `Cyclone tropical ${loc}. Mesures de protection requises.`;
  if (type === 'flood') return `Alerte inondation ${loc}.`;
  if (type === 'wildfire') return `Incendie majeur ${loc}.`;
  if (type === 'volcano') return `Activité volcanique ${loc}.`;

  // Santé
  if (type === 'pandemic') return `Alerte pandémie. Surveillance renforcée ${loc}.`;
  if (type === 'epidemic' || type === 'outbreak') return `Foyer épidémique signalé ${loc}.`;

  // Militaire
  if (type === 'missile') return `Lancement de missile détecté ${loc}. Alerte critique.`;
  if (type === 'airstrike') return `Frappe aérienne ${loc}. Alerte confirmée.`;
  if (type === 'nuclear') return `Alerte nucléaire ${loc}. Niveau maximal.`;
  if (type === 'terrorism') return `Attaque terroriste ${loc}.`;

  // Par sévérité
  if (severity === 'critical') return `Alerte critique ${loc}. Situation en cours.`;
  if (severity === 'high') return `Alerte élevée signalée ${loc}.`;

  return '';
}

// ── API publique principale ────────────────────────────────────────────────────
export function soundIncoming() {
  playSound('nouvelle_donnee.mp3', 0.50);
  playSound('nouvelle_donnee_analyse.mp3', 0.40);
}

export function soundVerifiedCritical() {
  playSound('alerte_critique.mp3', 0.85);
  playSound('flash_special.mp3', 0.70);
}

export function soundVerifiedHigh() {
  playSound('seuil_alerte_atteint.mp3', 0.75);
  playSound('Information_urgente.mp3', 0.60);
}

export function soundVerifiedMedium() {
  playSound('alerte_confirmee.mp3', 0.60);
}

export function soundVerifiedLow() {
  playSound('nouvelle_donnee_confirme.mp3', 0.45);
}

export function soundDataRefresh() {
  playSound('donnees_actualisees.mp3', 0.35);
}

export function soundMissileLaunch() {
  playSound('tir_missile_detecte.mp3', 0.85);
}

export function soundMissileImpact() {
  playSound('impact_missile_detecte.mp3', 0.90);
}

export function soundMultipleLaunches() {
  playSound('lancements_multiples.mp3', 0.90);
}

/**
 * Son + TTS complet selon type + sévérité.
 * À appeler quand aiVerified passe à true sur une alerte.
 */
export function soundVerifiedResult(type: string, severity: string, title = '', country?: string | null) {
  const isMissile = type === 'missile' || type === 'airstrike';
  const isImpact = /impact|frappe|struck|hit|landed/i.test(title);
  const isDisaster = ['earthquake','tsunami','hurricane','flood','wildfire','volcano','cyclone','tornado','avalanche'].includes(type);
  const isHealth = ['pandemic','epidemic','outbreak','biological'].includes(type);

  // Sons préenregistrés
  if (isMissile) {
    if (isImpact) soundMissileImpact();
    else soundMissileLaunch();
  } else if (severity === 'critical') {
    soundVerifiedCritical();
  } else if (severity === 'high') {
    soundVerifiedHigh();
  } else if (severity === 'medium') {
    soundVerifiedMedium();
  } else {
    soundVerifiedLow();
  }

  // TTS pour critical + high + disasters + health
  if (severity === 'critical' || severity === 'high' || isDisaster || isHealth) {
    const msg = buildTtsMessage(type, severity, title, country);
    if (msg) {
      setTimeout(() => speak(msg), isMissile ? 3500 : 1200);
    }
  }
}
