'use client';

import React, { useEffect, useMemo, useState } from 'react';

type LastSyncedProps = {
    timestamp: string | null;
    loading?: boolean;
};

function formatRelativeSync(value: string | null, nowMs: number) {
    if (!value) return 'Waiting for first sync';

    const ts = new Date(value).getTime();
    if (!Number.isFinite(ts)) return 'Waiting for first sync';

    const diffSec = Math.max(0, Math.floor((nowMs - ts) / 1000));
    if (diffSec < 2) return 'Synced just now';
    if (diffSec < 60) return `Synced ${diffSec}s ago`;

    const min = Math.floor(diffSec / 60);
    if (min < 60) return `Synced ${min}m ago`;

    const hr = Math.floor(min / 60);
    if (hr < 24) return `Synced ${hr}h ago`;

    return `Synced ${new Date(value).toLocaleString()}`;
}

export function LastSynced({ timestamp, loading = false }: LastSyncedProps) {
    const [nowMs, setNowMs] = useState(Date.now());

    useEffect(() => {
        const id = window.setInterval(() => setNowMs(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const label = useMemo(() => formatRelativeSync(timestamp, nowMs), [timestamp, nowMs]);

    return (
        <p className="text-xs font-medium text-slate-500">
            {loading ? 'Syncing...' : label}
        </p>
    );
}
