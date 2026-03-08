import { formatDistanceToNow } from "date-fns";
import { Globe, MessageCircle, Send, Twitter, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsItem } from "@shared/schema";
import { memo } from "react";

interface NewsCardProps {
  item: NewsItem;
}

function getSourceIcon(source: string) {
  const s = source.toLowerCase();
  if (s.includes("twitter") || s.includes("x")) return <Twitter className="w-3.5 h-3.5" />;
  if (s.includes("telegram")) return <Send className="w-3.5 h-3.5" />;
  if (s.includes("reddit")) return <MessageCircle className="w-3.5 h-3.5" />;
  return <Globe className="w-3.5 h-3.5" />;
}

export const NewsCard = memo(function NewsCard({ item }: NewsCardProps) {
  const isBreaking = item.isBreaking;
  const publishedDate = new Date(item.publishedAt || item.createdAt);
  
  return (
    <div 
      className={cn(
        "group relative flex flex-col gap-3 p-4 md:p-5 rounded-xl transition-all duration-300",
        "bg-card border border-border/50 hover:border-border hover:bg-card/80",
        isBreaking ? "border-destructive/30 bg-destructive/5 glow-breaking" : "hover:shadow-lg hover:shadow-black/20"
      )}
    >
      {/* Header / Metadata */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50 border border-border/50 text-secondary-foreground">
            {getSourceIcon(item.source)}
            <span className="uppercase tracking-wider font-semibold">{item.source}</span>
          </div>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-border" />
            {formatDistanceToNow(publishedDate, { addSuffix: true })}
          </span>
        </div>

        {isBreaking && (
          <div className="flex items-center gap-1.5 text-xs font-bold font-mono tracking-widest text-destructive bg-destructive/10 px-2 py-1 rounded border border-destructive/20 animate-in fade-in zoom-in duration-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            BREAKING
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <h3 className={cn(
            "text-base md:text-lg font-bold leading-snug tracking-tight",
            isBreaking ? "text-foreground" : "text-foreground/90 group-hover:text-foreground transition-colors"
          )}>
            {item.title}
          </h3>
          
          <p className="text-sm text-muted-foreground/90 leading-relaxed line-clamp-3">
            {item.content}
          </p>
          
          {item.url && (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors mt-2"
            >
              View original source
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Thumbnail Image */}
        {item.imageUrl && (
          <div className="shrink-0 w-full md:w-32 lg:w-40 aspect-video md:aspect-square rounded-lg overflow-hidden border border-border/50 bg-secondary">
            <img 
              src={item.imageUrl} 
              alt={item.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
});
