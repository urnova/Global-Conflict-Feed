import { useAiSummary } from "@/hooks/use-ai-summary";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Brain, RefreshCw, ChevronDown, ChevronUp, Clock, AlertTriangle } from "lucide-react";
import { useState, useCallback } from "react";

function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*(.+?)\*\*$/);
    if (m) return <strong key={i} className="text-[#00F5FF]/90 font-bold">{m[1]}</strong>;
    return part;
  });
}

function MarkdownText({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1.5" />;

        const headerMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
        if (headerMatch) {
          return (
            <div key={i} className="text-[#00F5FF] text-[8.5px] font-bold tracking-[0.12em] uppercase pt-2 pb-0.5 flex items-center gap-1.5"
              style={{ borderTop: "1px solid rgba(0,245,255,0.12)" }}>
              <span className="w-1 h-1 rounded-full bg-[#00F5FF] shrink-0" />
              {headerMatch[1]}
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-2 text-[10px] font-mono text-white/65 leading-relaxed pl-1">
              <span className="text-[#00F5FF]/40 font-bold shrink-0 w-3 text-right">{numMatch[1]}.</span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          );
        }

        const bulletMatch = trimmed.match(/^[-•·]\s+(.+)$/);
        if (bulletMatch) {
          return (
            <div key={i} className="flex gap-2 text-[10px] font-mono text-white/65 leading-relaxed pl-1">
              <span className="text-[#00F5FF]/30 shrink-0">›</span>
              <span>{renderInline(bulletMatch[1])}</span>
            </div>
          );
        }

        return (
          <p key={i} className="text-[10px] font-mono text-white/60 leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

interface Props {
  onHide?: () => void;
  headless?: boolean;
}

export function AiSummaryPanel({ onHide, headless = false }: Props) {
  const { data, isLoading, isError, refetch } = useAiSummary();
  const [collapsed, setCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const ago = data?.generatedAt
    ? formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true, locale: fr })
    : null;

  const ageHours = data?.generatedAt
    ? (Date.now() - new Date(data.generatedAt).getTime()) / 3_600_000
    : null;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch("/api/summary/refresh", { method: "POST" });
      await refetch?.();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const wrapper = headless ? "h-full flex flex-col" : "glass-card rounded-xl h-full flex flex-col";

  return (
    <div className={wrapper} style={!headless ? { border: "1px solid rgba(0,245,255,0.15)" } : {}}>
      {!headless && (
        <div className="flex items-center justify-between px-3 py-2 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-[#00F5FF]" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#00F5FF]">Briefing Stratégique</span>
            {data && <span className="text-[7.5px] font-mono text-white/25">{data.alertCount} evt</span>}
          </div>
          <div className="flex items-center gap-1">
            {ageHours !== null && ageHours > 2 && (
              <span className="flex items-center gap-0.5 text-[7px] font-bold px-1.5 py-px rounded"
                style={{ background: "rgba(255,184,0,0.12)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.25)" }}>
                <Clock className="w-2 h-2" />{Math.floor(ageHours)}h
              </span>
            )}
            <button onClick={handleRefresh} disabled={refreshing} title="Régénérer"
              className="text-white/25 hover:text-[#00F5FF] transition-colors p-0.5 rounded disabled:opacity-30">
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => setCollapsed(p => !p)} className="text-white/25 hover:text-white/60 transition-colors p-0.5 rounded">
              {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
            {onHide && (
              <button onClick={onHide} className="text-white/25 hover:text-white/60 transition-colors p-0.5 rounded">
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 py-2.5">
          {isLoading && (
            <div className="space-y-1.5 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-2 rounded animate-pulse" style={{ width: `${65 + i * 6}%`, background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          )}

          {!isLoading && (isError || data === null) && (
            <div className="flex flex-col items-center gap-2 py-6">
              <Brain className="w-8 h-8 text-white/10" />
              <p className="text-[9px] font-mono text-white/25 text-center leading-relaxed">
                {isError ? "Erreur de connexion" : "Génération en cours…\nPremier briefing dans ~3 min"}
              </p>
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1 h-1 rounded-full bg-[#00F5FF]/30 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          {data && (
            <div className="space-y-2">
              {/* Top countries */}
              {data.topCountries.length > 0 && (
                <div className="flex flex-wrap gap-1 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {data.topCountries.map(c => (
                    <span key={c} className="text-[7.5px] font-bold uppercase px-1.5 py-px rounded"
                      style={{ background: "rgba(0,245,255,0.08)", color: "rgba(0,245,255,0.7)", border: "1px solid rgba(0,245,255,0.15)" }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Briefing text */}
              <MarkdownText text={data.text} />

              {/* Timestamp */}
              {ago && (
                <div className="pt-2 flex items-center justify-end gap-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <Clock className="w-2.5 h-2.5 text-white/15" />
                  <span className="text-[7.5px] font-mono text-white/20">Généré {ago}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
