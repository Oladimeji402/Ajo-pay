'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
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

export function useRealtimeSubscription(options?: UseRealtimeSubscriptionOptions) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('connecting');

  const schema = options?.schema ?? 'public';
  const tables = options?.tables ?? DEFAULT_TABLES;
  const channelName = options?.channelName ?? `admin-live-${tables.join('-')}`;

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    const channel = supabase.channel(channelName);

    const onChange = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      setRefreshTrigger((value) => value + 1);
      setLastEvent({
        table: payload.table,
        eventType: payload.eventType,
        timestamp: new Date().toISOString(),
      });
    };

    for (const table of tables) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema,
          table,
        },
        onChange,
      );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('subscribed');
        return;
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setConnectionStatus('errored');
        return;
      }

      if (status === 'CLOSED') {
        setConnectionStatus('closed');
        return;
      }

      setConnectionStatus('connecting');
    });

    return () => {
      setConnectionStatus('closed');
      void supabase.removeChannel(channel);
    };
  }, [channelName, schema, supabase, tables]);

  return {
    lastEvent,
    refreshTrigger,
    connectionStatus,
  };
}
