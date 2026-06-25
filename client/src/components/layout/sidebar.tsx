import { Link, useLocation } from "wouter";
import { Globe, History, BookOpen, Satellite, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

function useImminentLaunch(): boolean {
  const [imminent, setImminent] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(
          'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&format=json',
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const next = data.results?.[0];
        if (!next?.net) return;
        const ms = new Date(next.net).getTime() - Date.now();
        if (!cancelled) setImminent(ms > 0 && ms < 24 * 3600 * 1000);
      } catch {
        // Network error or timeout — ignore
      }
    }

    check();
    const t = setInterval(check, 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return imminent;
}

export function Sidebar() {
  const [location] = useLocation();
  const imminentLaunch = useImminentLaunch();

  const links = [
    { href: "/", label: "Live Radar", icon: Globe },
    { href: "/live", label: "Espace", icon: Satellite, badge: imminentLaunch },
    { href: "/history", label: "Alert History", icon: History },
    { href: "/guide", label: "Guide & Légende", icon: BookOpen },
  ];

  return (
    <div className="w-64 h-full glass-panel border-r border-y-0 border-l-0 flex flex-col z-50">
      <div className="p-5 flex flex-col items-center gap-1 border-b border-white/5">
        <img
          src="/argos.svg"
          alt="ARGOS"
          className="h-16 w-auto"
          style={{ filter: 'brightness(0) saturate(100%) invert(78%) sepia(60%) saturate(400%) hue-rotate(155deg) brightness(110%)' }}
        />
        <span className="text-[8px] text-muted-foreground/40 font-mono mt-1 tracking-widest uppercase">by Astral Security</span>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="block">
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 font-medium tracking-wide",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
              )}>
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "opacity-70")} />
                <span className="flex-1">{link.label}</span>
                {link.badge && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ background: '#FFB800' }} />
                    <span className="relative inline-flex rounded-full h-2 w-2"
                      style={{ background: '#FFB800' }} />
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="px-4 pb-3">
        <Link href="/admin" className="block">
          <div className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-300 font-medium tracking-wide text-sm",
            location === '/admin'
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "text-muted-foreground/40 hover:bg-white/3 hover:text-muted-foreground/70 border border-transparent"
          )}>
            <Lock className="w-4 h-4 opacity-70" />
            <span className="text-[11px] tracking-widest uppercase font-bold">Admin</span>
          </div>
        </Link>
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="rounded-lg bg-background/50 border border-white/5 p-4 flex flex-col items-center justify-center text-center">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mb-2 shadow-[0_0_8px_#22c55e]" />
          <span className="text-xs font-mono text-muted-foreground">SYSTEM ONLINE</span>
          <span className="text-[10px] text-muted-foreground/50 mt-1">ARGOS NODE-G9X</span>
        </div>
      </div>
    </div>
  );
}
