import { useNews } from "@/hooks/use-news";
import { Layout } from "@/components/layout";
import { NewsCard } from "@/components/news-card";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Loader2 } from "lucide-react";

export default function Home() {
  const { data: newsItems, isLoading, isError, isConnected } = useNews();

  return (
    <Layout isConnected={isConnected} totalEvents={newsItems?.length || 0}>
      <div className="space-y-4 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="font-mono text-sm tracking-widest uppercase">Initializing Intelligence Feed...</p>
          </div>
        ) : isError ? (
          <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 text-center text-destructive">
            <p className="font-medium">Critical Failure: Unable to establish feed connection.</p>
            <p className="text-sm mt-1 opacity-80 font-mono">Check network diagnostics and try again.</p>
          </div>
        ) : !newsItems || newsItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-card/20">
            <Activity className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-mono text-sm uppercase tracking-widest">Awaiting Transmissions...</p>
          </div>
        ) : (
          <div className="relative">
            <AnimatePresence initial={false}>
              {newsItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    opacity: { duration: 0.3 },
                    layout: { type: "spring", bounce: 0.3, duration: 0.6 }
                  }}
                  className="mb-4" // Margin bottom instead of wrapper spacing for better layout animations
                >
                  <NewsCard item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  );
}
