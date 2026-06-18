import { AppLayout } from "@/components/layout";
import { useAlerts } from "@/hooks/use-alerts";
import { useBriefings } from "@/hooks/use-briefings";
import { format, formatDistanceToNow } from "date-fns";
import { Search, Globe2, AlertTriangle, BarChart3, ExternalLink, Brain,
  Navigation2, Zap, Activity, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo } from "react";
import type { Alert } from "@shared/schema";
import { clsx } from "clsx";

// ── Helpers ──────────────────────────────────────────────────────────────────
const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const SEV_STYLES: Record<string, { color: string; bg: string }> = {
  critical: { color: "#F02D3A", bg: "rgba(240,45,58,0.12)" },
  high:     { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  medium:   { color: "#00C8D4", bg: "rgba(0,200,212,0.12)"  },
  low:      { color: "#4B5563", bg: "rgba(75,85,99,0.12)"   },
};

const TYPE_LABELS: Record<string, string> = {
  missile: "Missile", airstrike: "Airstrike", artillery: "Artillery",
  naval: "Naval", conflict: "Combat", explosion: "Explosion",
  chemical: "Chemical", nuclear: "Nuclear", cyber: "Cyber",
  massacre: "Massacre", terrorism: "Terrorism", coup: "Coup",
  earthquake: "Earthquake", tsunami: "Tsunami", volcano: "Volcano",
  flood: "Flood", wildfire: "Wildfire", avalanche: "Avalanche",
  hurricane: "Hurricane", cyclone: "Cyclone", tornado: "Tornado",
  storm: "Storm", heatwave: "Heatwave", pandemic: "Pandemic",
  epidemic: "Epidemic", diplomatic: "Diplomatic", political: "Political",
  sanctions: "Sanctions", protest: "Protest", humanitarian: "Humanitarian",
  breaking: "Breaking", warning: "Alert", info: "Info",
};

function FlagImg({ code }: { code?: string | null }) {
  if (!code || code.length !== 2) return null;
  return (
    <img src={`https://flagcdn.com/20x15/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/40x30/${code.toLowerCase()}.png 2x`}
      width="16" height="12" alt={code}
      className="rounded-sm opacity-70 shrink-0" />
  );
}

function SeverityBadge({ sev }: { sev: string }) {
  const s = SEV_STYLES[sev] ?? SEV_STYLES.low;
  const labels: Record<string, string> = { critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", low: "LOW" };
  return (
    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}25` }}>
      {labels[sev] ?? sev}
    </span>
  );
}

// ── Alert row ─────────────────────────────────────────────────────────────────
function AlertRow({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV_STYLES[alert.severity] ?? SEV_STYLES.low;

  return (
    <div className="group transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02]"
        onClick={() => setExpanded(p => !p)}>
        {/* Severity accent */}
        <div className="w-0.5 h-full absolute left-0 top-0 rounded-r"
          style={{ background: sev.color, opacity: 0.45 }} />

        {/* Time */}
        <span className="text-[9px] font-mono text-white/25 shrink-0 w-24">
          {alert.timestamp ? format(new Date(alert.timestamp), "dd/MM/yy HH:mm") : "—"}
        </span>

        {/* Type */}
        <span className="text-[9px] font-mono font-semibold shrink-0 w-24 truncate"
          style={{ color: "rgba(255,255,255,0.5)" }}>
          {TYPE_LABELS[alert.type ?? ""] ?? alert.type ?? "—"}
        </span>

        {/* Country */}
        <div className="flex items-center gap-1.5 shrink-0 w-28">
          <FlagImg code={alert.countryCode} />
          <span className="text-[10px] text-white/50 truncate">{alert.country ?? "—"}</span>
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-white/80 truncate">{alert.title}</p>
        </div>

        {/* Severity */}
        <div className="shrink-0">
          <SeverityBadge sev={alert.severity} />
        </div>

        {/* Source */}
        <div className="shrink-0 w-8 flex justify-center">
          {alert.source ? (
            <a href={alert.source} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-white/20 hover:text-[#00C8D4] transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-[8px] font-mono text-white/15">—</span>
          )}
        </div>

        {/* Expand */}
        <div className="shrink-0 text-white/15 group-hover:text-white/35 transition-colors">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </div>

      {/* Expanded description */}
      {expanded && alert.description && (
        <div className="px-4 pb-3 pt-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-[10px] font-mono text-white/40 leading-relaxed pl-28">
            {alert.description}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function History() {
  const { data: alerts, isLoading }               = useAlerts();
  const { data: briefings, isLoading: briefLoad } = useBriefings();
  const [activeTab,      setActiveTab]   = useState<"alerts" | "briefings">("alerts");
  const [search,         setSearch]      = useState("");
  const [typeFilter,     setTypeFilter]  = useState("all");
  const [severityFilter, setSevFilter]   = useState("all");
  const [countryFilter,  setCountryFilter] = useState("all");

  const countries = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; code: string }[] = [];
    alerts?.forEach(a => {
      if (a.country && !seen.has(a.country)) {
        seen.add(a.country);
        list.push({ name: a.country, code: a.countryCode ?? "" });
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [alerts]);

  const stats = useMemo(() => {
    if (!alerts) return null;
    return {
      total:    alerts.length,
      critical: alerts.filter(a => a.severity === "critical").length,
      high:     alerts.filter(a => a.severity === "high").length,
      missiles: alerts.filter(a => a.type === "missile" || a.type === "airstrike").length,
    };
  }, [alerts]);

  const filtered = useMemo(() => {
    return (alerts ?? [])
      .filter(a => {
        const q = search.toLowerCase();
        if (q && !a.title.toLowerCase().includes(q) &&
            !(a.description ?? "").toLowerCase().includes(q) &&
            !(a.country ?? "").toLowerCase().includes(q)) return false;
        if (typeFilter !== "all" && a.type !== typeFilter) return false;
        if (severityFilter !== "all" && a.severity !== severityFilter) return false;
        if (countryFilter !== "all" && a.country !== countryFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const sd = (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9);
        if (sd !== 0) return sd;
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });
  }, [alerts, search, typeFilter, severityFilter, countryFilter]);

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl"
                style={{ background: "rgba(0,200,212,0.08)", border: "1px solid rgba(0,200,212,0.15)" }}>
                <BarChart3 className="w-5 h-5 text-[#00C8D4]" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white/90">Global Archives</h1>
                <p className="text-[10px] font-mono text-white/30 mt-0.5">
                  ARGOS Database — geolocated incidents
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl w-fit"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {([
                { key: "alerts",    label: "Incidents",   icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                { key: "briefings", label: "AI Briefings",icon: <Brain className="w-3.5 h-3.5" /> },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={activeTab === tab.key
                    ? { background: "rgba(0,200,212,0.10)", color: "#00C8D4", border: "1px solid rgba(0,200,212,0.20)" }
                    : { color: "rgba(255,255,255,0.30)", border: "1px solid transparent" }}>
                  <span style={{ color: activeTab === tab.key ? "#00C8D4" : "rgba(255,255,255,0.25)" }}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── BRIEFINGS TAB ── */}
            {activeTab === "briefings" && (
              <div className="space-y-3">
                {briefLoad && (
                  <div className="rounded-xl p-8 text-center text-white/20 font-mono text-xs animate-pulse"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    Loading briefings…
                  </div>
                )}
                {!briefLoad && (!briefings || briefings.length === 0) && (
                  <div className="rounded-xl p-10 text-center"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Brain className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="text-[11px] font-mono text-white/25">
                      No briefings available yet.<br />The first one will be generated automatically ~3 minutes after startup.
                    </p>
                  </div>
                )}
                {briefings?.map(b => {
                  const parsedCountries: string[] = Array.isArray(b.topCountries) ? b.topCountries : [];
                  const ago = formatDistanceToNow(new Date(b.generatedAt), { addSuffix: true });
                  return (
                    <div key={b.id} className="rounded-xl overflow-hidden"
                      style={{ background: "rgba(6,8,16,0.95)", border: "1px solid rgba(0,200,212,0.12)" }}>
                      <div className="flex items-center justify-between px-4 py-2.5"
                        style={{ background: "rgba(0,200,212,0.05)", borderBottom: "1px solid rgba(0,200,212,0.10)" }}>
                        <div className="flex items-center gap-2">
                          <Brain className="w-3.5 h-3.5 text-[#00C8D4]" />
                          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#00C8D4]">
                            Argos IA · {format(new Date(b.generatedAt), "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-white/25">{b.alertCount} events · {ago}</span>
                      </div>
                      {parsedCountries.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                          {parsedCountries.map((c: string) => (
                            <span key={c} className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                              style={{ background: "rgba(0,200,212,0.08)", color: "rgba(0,200,212,0.6)", border: "1px solid rgba(0,200,212,0.15)" }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="px-4 py-4 text-[11px] font-mono text-white/55 leading-relaxed whitespace-pre-wrap">
                        {b.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── ALERTS TAB ── */}
            {activeTab === "alerts" && (
              <>
                {/* Stats */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Total",    value: stats.total,    color: "#00C8D4" },
                      { label: "Critical", value: stats.critical, color: "#F02D3A" },
                      { label: "High",     value: stats.high,     color: "#F59E0B" },
                      { label: "Strikes",  value: stats.missiles, color: "#EF4444" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-4"
                        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="text-[9px] font-mono uppercase tracking-widest mb-1"
                          style={{ color: `${s.color}70` }}>
                          {s.label}
                        </div>
                        <div className="text-3xl font-bold tabular-nums" style={{ color: s.color }}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type="text"
                      placeholder="Search…"
                      className="pl-7 pr-3 py-1.5 rounded-lg text-[11px] font-mono text-white/60 placeholder:text-white/20 outline-none w-48"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={typeFilter} onChange={setTypeFilter}>
                    <option value="all">All types</option>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                  <Select value={severityFilter} onChange={setSevFilter}>
                    <option value="all">All severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Select>
                  <Select value={countryFilter} onChange={setCountryFilter}>
                    <option value="all">All countries</option>
                    {countries.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </Select>
                  <span className="ml-auto text-[9px] font-mono text-white/25">
                    {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Table */}
                <div className="rounded-xl overflow-hidden"
                  style={{ background: "rgba(6,8,16,0.95)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {/* Header row */}
                  <div className="flex items-center gap-3 px-4 py-2.5 text-[9px] font-mono font-semibold uppercase tracking-widest text-white/25"
                    style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="w-24 shrink-0">Date/Time</span>
                    <span className="w-24 shrink-0">Type</span>
                    <span className="w-28 shrink-0">Country</span>
                    <span className="flex-1">Incident</span>
                    <span className="shrink-0">Severity</span>
                    <span className="w-8 shrink-0 text-center">Src</span>
                    <span className="w-4 shrink-0" />
                  </div>

                  {isLoading ? (
                    <div className="p-12 text-center">
                      <div className="text-[11px] font-mono text-white/20 animate-pulse">Acquiring data…</div>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                      <Globe2 className="w-8 h-8 text-white/8 mx-auto mb-3" />
                      <p className="text-[10px] font-mono text-white/20">No incidents found</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {filtered.map(a => <AlertRow key={a.id} alert={a} />)}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ── Styled select helper ──────────────────────────────────────────────────────
function Select({ value, onChange, children }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg text-[11px] font-mono text-white/55 outline-none cursor-pointer"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {children}
    </select>
  );
}
