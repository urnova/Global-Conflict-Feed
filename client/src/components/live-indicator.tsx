import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  active: boolean;
  label?: string;
  className?: string;
}

export function LiveIndicator({ active, label = "LIVE", className }: LiveIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 font-mono text-xs font-medium tracking-wider", className)}>
      <div className="relative flex items-center justify-center h-3 w-3">
        {active ? (
          <>
            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive/50 opacity-75 animate-pulse-ring"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/50"></span>
        )}
      </div>
      <span className={active ? "text-destructive" : "text-muted-foreground"}>
        {active ? label : "OFFLINE"}
      </span>
    </div>
  );
}
