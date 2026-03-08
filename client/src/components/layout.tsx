import { ReactNode } from "react";
import { Activity, ShieldAlert, Radio, Database, Search } from "lucide-react";
import { LiveIndicator } from "./live-indicator";

interface LayoutProps {
  children: ReactNode;
  isConnected: boolean;
  totalEvents: number;
}

export function Layout({ children, isConnected, totalEvents }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar - Hidden on mobile, visible on md+ */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/60 bg-card/30 backdrop-blur-xl sticky top-0 h-screen p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
            <ShieldAlert className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-widest text-foreground">NEXUS</h1>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Global Intel Feed</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xs font-mono text-muted-foreground px-2 uppercase tracking-widest">System Status</h2>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-secondary/30 border border-transparent">
                <span className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-muted-foreground" /> Connection
                </span>
                <LiveIndicator active={isConnected} label="SYNCED" />
              </div>
              <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-secondary/30 border border-transparent">
                <span className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                  <Database className="w-4 h-4 text-muted-foreground" /> Monitored Events
                </span>
                <span className="text-xs font-mono font-medium">{totalEvents}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-mono text-muted-foreground px-2 uppercase tracking-widest">Filters</h2>
            <div className="px-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Filter events..." 
                  className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  disabled
                />
              </div>
            </div>
          </div>
        </nav>

        <div className="mt-auto border-t border-border/50 pt-4 px-2">
          <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
            Data sourced in real-time from automated scrapers and API integrations.
            Classified as UNRESTRICTED.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-sm tracking-widest text-foreground">NEXUS</h1>
          </div>
          <LiveIndicator active={isConnected} />
        </header>

        {/* Top Gradient Fade (Desktop) */}
        <div className="hidden md:block absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden max-w-4xl mx-auto w-full">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Live Feed
              </h2>
              <p className="text-sm text-muted-foreground font-mono">Real-time global event monitoring</p>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
