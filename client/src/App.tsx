import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/language-context";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import History from "@/pages/history";
import Guide from "@/pages/guide";
import LiveView from "@/pages/liveview";
import RadioMilitary from "@/pages/radio";
import AdminPage from "@/pages/admin";

import { useEffect } from "react";

function useAutoSync() {
  useEffect(() => {
    const syncFeeds = async () => {
      try {
        await fetch('/api/sync', { method: 'POST' });
      } catch (e) {
        // ignore errors silently
      }
    };
    
    // Sync immediately on load
    syncFeeds();
    
    // Then every 2 minutes
    const interval = setInterval(syncFeeds, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}

function Router() {
  useAutoSync();
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/history" component={History} />
      <Route path="/live" component={LiveView} />
      <Route path="/radio" component={RadioMilitary} />
      <Route path="/guide" component={Guide} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster />
          <Router />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
