import { useQuery } from '@tanstack/react-query';

export type ServerStatus = 'ok' | 'error' | 'connecting';

export interface ServerHealth {
  status: ServerStatus;
  db: boolean;
  groq: boolean;
}

export function useServerStatus(): ServerStatus {
  const { data, isError, isLoading } = useQuery<{ status: string; db?: boolean; groq?: boolean }>({
    queryKey: ['/api/health'],
    refetchInterval: 30_000,
    retry: 1,
    staleTime: 25_000,
  });

  if (isLoading) return 'connecting';
  if (isError || data?.status !== 'ok') return 'error';
  return 'ok';
}

export function useServerHealth(): ServerHealth {
  const { data, isError, isLoading } = useQuery<{ status: string; db?: boolean; groq?: boolean }>({
    queryKey: ['/api/health'],
    refetchInterval: 30_000,
    retry: 1,
    staleTime: 25_000,
  });

  if (isLoading) return { status: 'connecting', db: true, groq: true };
  if (isError)   return { status: 'error', db: false, groq: false };
  return {
    status: data?.status === 'ok' ? 'ok' : 'error',
    db:   data?.db   !== false,
    groq: data?.groq !== false,
  };
}
