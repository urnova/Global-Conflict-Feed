import { AppLayout } from "@/components/layout";
import {
  Globe2, Siren, Filter, MousePointer2,
  ChevronRight, BookOpen, Brain, Waves, MapPin, Navigation2,
  MessageSquare,
} from "lucide-react";

const ALERT_TYPES = [
  { type: "missile",   icon: "🚀", color: "#FF003C", label: "Missile / Projectile",    desc: "Lancement balistique, roquette ou projectile longue portée." },
  { type: "airstrike", icon: "✈️", color: "#FF003C", label: "Frappe aérienne",          desc: "Bombardement par aéronef militaire, drone armé ou hélicoptère." },
  { type: "conflict",  icon: "⚔️", color: "#FFB800", label: "Conflit armé",             desc: "Affrontements terrestres, assauts, contre-offensives entre forces armées." },
  { type: "artillery", icon: "💣", color: "#FFB800", label: "Artillerie / Obus",        desc: "Tirs de mortiers ou pièces lourdes sur positions civiles ou militaires." },
  { type: "explosion", icon: "💥", color: "#FFB800", label: "Explosion / Détonation",   desc: "IED, dépôt de munitions, infrastructure détruite." },
  { type: "terrorism", icon: "🔴", color: "#FFB800", label: "Attentat terroriste",      desc: "Attaque revendiquée : attentat-suicide, fusillade de masse, prise d'otage." },
  { type: "coup",      icon: "⚖️", color: "#FFB800", label: "Coup d'État / Putsch",     desc: "Tentative de renversement d'un gouvernement par les militaires." },
  { type: "naval",     icon: "⚓", color: "#00F0FF", label: "Incident naval",           desc: "Affrontements en mer, blocus, abordage. Mer Rouge, Spratleys…" },
  { type: "cyber",     icon: "💻", color: "#00F0FF", label: "Cyberattaque",             desc: "Intrusion ou sabotage visant réseaux critiques, défense, gouvernement." },
  { type: "nuclear",   icon: "☢️", color: "#FF003C", label: "Menace nucléaire / CBRN", desc: "Essai nucléaire, alerte radiologique, arme chimique ou biologique." },
  { type: "massacre",  icon: "💀", color: "#FF003C", label: "Massacre / Atrocité",      desc: "Violence de masse contre des civils : exécutions, génocide, crimes de guerre." },
  { type: "chemical",  icon: "☣️", color: "#FF003C", label: "Arme chimique",            desc: "Utilisation confirmée ou suspectée d'agent chimique toxique en zone de conflit." },
  { type: "sanctions", icon: "🚫", color: "#8888FF", label: "Sanctions / Embargo",      desc: "Nouvelles sanctions économiques, gel d'avoirs ou embargo entre États." },
  { type: "protest",   icon: "📢", color: "#AAAAAA", label: "Protestation / Révolte",   desc: "Manifestations majeures, émeutes ou mouvements civils à impact géopolitique." },
  { type: "warning",   icon: "⚠️", color: "#AAAAAA", label: "Alerte / Avertissement",   desc: "Mobilisation, escalade diplomatique, tension non encore armée." },
];

const SEVERITIES = [
  {
    level: "critical", label: "CRITIQUE", color: "#FF003C",
    bg: "rgba(255,0,60,0.08)", border: "rgba(255,0,60,0.35)",
    desc: "Victimes confirmées, frappe majeure, arme CBRN, massacre ou coup d'État en cours.",
    effects: ["Overlay rouge plein écran", "Alerte sonore critique", "Animation missile 3D", "Marqueur globe pulsant"],
  },
  {
    level: "high", label: "ÉLEVÉ", color: "#FFB800",
    bg: "rgba(255,184,0,0.08)", border: "rgba(255,184,0,0.35)",
    desc: "Conflit actif, frappe aérienne, lancement missile, attentat significatif.",
    effects: ["Notification live", "Son d'alerte élevé", "Zoom globe automatique", "Anneau propagation orange"],
  },
  {
    level: "medium", label: "MOYEN", color: "#00F0FF",
    bg: "rgba(0,240,255,0.06)", border: "rgba(0,240,255,0.25)",
    desc: "Incident notable mais limité. Escarmouche, explosion isolée, tension diplomatique.",
    effects: ["Entrée dans le flux", "Son discret", "Anneau propagation cyan"],
  },
  {
    level: "low", label: "FAIBLE", color: "#888888",
    bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)",
    desc: "Alerte préventive ou info contextuelle. Déclaration non confirmée, rumeur, exercice.",
    effects: ["Flux uniquement", "Pas de son"],
  },
];

const GLOBE_FEATURES = [
  { icon: <MapPin className="w-4 h-4" />, title: "Marqueurs pin drapeaux", desc: "Icône de type + drapeau pays. Cliquer → détail alerte + zoom globe automatique." },
  { icon: <Waves className="w-4 h-4" />, title: "Anneaux de propagation", desc: "Ondes concentriques colorées par sévérité. Flash 10 secondes à chaque nouvelle alerte." },
  { icon: <Navigation2 className="w-4 h-4 rotate-45" />, title: "Animation missile", desc: "Arc 3D animé + point mobile de l'origine vers l'impact. Effet sonore en 3 phases." },
  { icon: <Globe2 className="w-4 h-4" />, title: "Polygones pays", desc: "Teintés selon le statut de tension : rouge guerre, orange élevé, jaune tension, cyan watchlist." },
];

export default function Guide() {
  return (
    <AppLayout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-5 py-8 space-y-12 pb-16">

          <header className="flex items-start gap-5">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-2xl font-black uppercase tracking-tight text-glow-primary">Guide Argos</h1>
                <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border"
                  style={{ background: 'rgba(0,240,255,0.1)', color: '#00F0FF', borderColor: 'rgba(0,240,255,0.3)' }}>V7</span>
              </div>
              <p className="text-muted-foreground text-xs font-mono leading-relaxed">
                Référence opérateur · Alertes · Globe 3D · Sévérités · EVA
              </p>
            </div>
          </header>

          <section>
            <SectionTitle icon={<Brain className="w-4 h-4" />} title="EVA — Intelligence Artificielle Astral" />
            <div className="glass-panel rounded-xl border border-white/10 p-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">EVA</strong> est l'intelligence artificielle d'Astral, intégrée au cœur d'ARGOS Intelligence. Elle analyse en temps quasi-réel chaque événement détecté : vérification de la pertinence, correction du type et de la sévérité, traduction et résumé factuel en français.
              </p>
              <p>
                EVA génère également un <strong className="text-foreground">briefing stratégique horaire</strong> synthétisant les événements confirmés des dernières 24h, ainsi qu'une <strong className="text-foreground">classification des tensions par pays</strong> mise à jour toutes les heures et visible sur le globe.
              </p>
              <p>
                Vous pouvez interagir directement avec EVA via le <strong className="text-foreground">panneau de chat</strong> disponible sur le globe. Posez vos questions sur la situation géopolitique actuelle, demandez un résumé par zone ou par pays, ou interrogez les données du flux en temps réel.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 text-[10px] font-mono bg-primary/8 border border-primary/20 rounded-lg px-3 py-2">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary font-bold">Chat EVA</span>
                  <span className="text-muted-foreground/60">→ icône en bas à droite du globe</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle icon={<Globe2 className="w-4 h-4" />} title="Globe 3D — Couches visuelles" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GLOBE_FEATURES.map((f, i) => (
                <div key={i} className="glass-panel rounded-xl border border-white/10 p-4 flex gap-3 items-start">
                  <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary mt-0.5">{f.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-foreground mb-0.5">{f.title}</div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 glass-panel rounded-xl border border-white/10 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/8 bg-white/3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <MousePointer2 className="w-3.5 h-3.5" /> Interactions
                </span>
              </div>
              {[
                { action: "Cliquer sur un marqueur pin",     result: "Ouvre le détail de l'alerte + zoom globe vers la position" },
                { action: "Cliquer sur un pays",             result: "Panneau pays : statut tension, raison FR, liste des incidents" },
                { action: "Cliquer alerte dans le Feed",     result: "Zoom animé vers la localisation sur le globe" },
                { action: "Glisser / scroll",                result: "Rotation manuelle — désactive temporairement la rotation auto" },
                { action: "Bouton son 🔊",                   result: "Active/coupe les alertes sonores (bas gauche du globe)" },
                { action: "Tri Feed (Récent / Critique)",    result: "Bascule entre tri chronologique et tri par sévérité" },
                { action: "Filtres Sévérité + Région",       result: "Filtre le flux en temps réel de façon permanente" },
                { action: "Boutons HUD bas-gauche",          result: "Masquer/afficher Tensions · Flux alertes · Briefing EVA" },
              ].map((item, i) => (
                <div key={i} className={`flex gap-3 items-start px-5 py-2.5 text-xs ${i % 2 === 0 ? 'bg-white/3' : ''} border-b border-white/5 last:border-0`}>
                  <ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  <span className="text-primary font-mono shrink-0 w-52">{item.action}</span>
                  <span className="text-muted-foreground">{item.result}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle icon={<Siren className="w-4 h-4" />} title="Niveaux de sévérité" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SEVERITIES.map(s => (
                <div key={s.level} className="glass-panel rounded-xl p-4 border" style={{ borderColor: s.border, background: s.bg }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                    <span className="font-black text-sm uppercase tracking-widest" style={{ color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2.5 leading-relaxed">{s.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {s.effects.map(e => (
                      <span key={e} className="text-[9px] font-mono px-2 py-0.5 rounded border border-white/10 bg-white/5 text-muted-foreground">{e}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="pb-4">
            <SectionTitle icon={<Filter className="w-4 h-4" />} title={`Types d'alertes (${ALERT_TYPES.length})`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ALERT_TYPES.map(t => (
                <div key={t.type} className="glass-panel rounded-xl border border-white/10 p-3.5 flex gap-3 items-start hover:border-white/20 transition-colors">
                  <span className="text-xl shrink-0 leading-none mt-0.5">{t.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-bold" style={{ color: t.color }}>{t.label}</span>
                    </div>
                    <span className="text-[9px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-muted-foreground/60 border border-white/8">{t.type}</span>
                    <p className="text-[10px] text-muted-foreground/70 mt-1.5 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </AppLayout>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
      {icon}
      <span>{title}</span>
      <span className="flex-1 h-px bg-white/8 ml-1" />
    </h2>
  );
}
