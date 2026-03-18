'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type RealtimeEvent = {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  timestamp: string;
};

type RealtimeConnectionStatus = 'connecting' | 'subscribed' | 'closed' | 'errored';

type UseRealtimeSubscriptionOptions = {
  channelName?: string;
  schema?: string;
  tables?: string[];
};

const DEFAULT_TABLES = ['contributions', 'payment_records', 'payouts', 'profiles', 'groups'];
const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

export function useRealtimeSubscription(options?: UseRealtimeSubscriptionOptions) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('connecting');

  const schema = options?.schema ?? 'public';
  const tables = options?.tables ?? DEFAULT_TABLES;
  const channelName = options?.channelName ?? `admin-live-${tables.join('-')}`;

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let mounted = true;

    const onChange = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      setRefreshTrigger((value) => value + 1);
      setLastEvent({
        table: payload.table,
        eventType: payload.eventType,
        timestamp: new Date().toISOString(),
      });
    };

    const connect = () => {
      const ch = supabase.channel(channelName);
      activeChannelRef.current = ch;

      for (const table of tables) {
        ch.on(
          'postgres_changes',
          { event: '*', schema, table },
          onChange,
        );
      }

      ch.subscribe((status) => {
        if (!mounted) return;

        if (status === 'SUBSCRIBED') {
          retryCountRef.current = 0;
          setConnectionStatus('subscribed');
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('errored');
          // Exponential backoff: 1 s → 2 s → 4 s … capped at 30 s.
          const delay = Math.min(BACKOFF_BASE_MS * (2 ** retryCountRef.current), BACKOFF_MAX_MS);
          retryCountRef.current += 1;
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            if (!mounted) return;
            void supabase.removeChannel(ch).then(() => {
              if (!mounted) return;
              setConnectionStatus('connecting');
              connect();
            });
          }, delay);
          return;
        }

        if (status === 'CLOSED') {
          setConnectionStatus('closed');
          return;
        }

        setConnectionStatus('connecting');
      });
    };

    connect();

    return () => {
      mounted = false;
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      retryCountRef.current = 0;
      setConnectionStatus('closed');
      if (activeChannelRef.current) {
        void supabase.removeChannel(activeChannelRef.current);
        activeChannelRef.current = null;
      }
    };
  }, [channelName, schema, supabase, tables]);

  return {
    lastEvent,
    refreshTrigger,
    connectionStatus,
  };
}
