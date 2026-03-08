import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ws as wsSchema } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useNews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  // 1. Fetch initial state
  const query = useQuery({
    queryKey: [api.news.list.path],
    queryFn: async () => {
      const res = await fetch(api.news.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch live feed");
      return api.news.list.responses[200].parse(await res.json());
    },
  });

  // 2. Setup WebSocket for live updates
  useEffect(() => {
    // Construct WS URL from current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let socket: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'news') {
            const newItem = wsSchema.receive.news.parse(data.payload);
            
            // Optimistically update the cache
            queryClient.setQueryData<typeof newItem[]>([api.news.list.path], (old) => {
              if (!old) return [newItem];
              // Prevent duplicates if server sends the same ID
              if (old.some(item => item.id === newItem.id)) return old;
              return [newItem, ...old];
            });

            // Trigger toast for breaking news
            if (newItem.isBreaking) {
              toast({
                title: "⚠️ BREAKING INTEL",
                description: newItem.title,
                variant: "destructive",
                duration: 6000,
              });
            }
          }
        } catch (e) {
          console.error("Failed to process WebSocket message", e);
        }
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, [queryClient, toast]);

  return {
    ...query,
    isConnected,
  };
}
