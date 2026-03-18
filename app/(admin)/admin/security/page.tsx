'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { notifyError } from '@/lib/toast';

type LoginAttempt = {
    id: string;
    email: string;
    ip: string;
    succeeded: boolean;
    user_agent?: string | null;
    attempted_at: string;
};

const OUTCOME_OPTIONS = [
    { value: 'all', label: 'All outcomes' },
    { value: 'failed', label: 'Failed only' },
    { value: 'succeeded', label: 'Succeeded only' },
];

const WINDOW_OPTIONS = [
    { value: '15', label: 'Last 15 minutes' },
    { value: '60', label: 'Last 1 hour' },
    { value: '240', label: 'Last 4 hours' },
    { value: '1440', label: 'Last 24 hours' },
];

const MAX_FAILED_ATTEMPTS = 5;

function SecurityPageSkeleton() {
    return (
        <div className="space-y-5 animate-pulse">
            <section className="rounded-2xl border border-slate-100 bg-white p-4 md:p-5 space-y-3">
                <div className="h-3 w-16 rounded bg-slate-200" />
                <div className="h-7 w-56 rounded bg-slate-200" />
                <div className="h-4 w-80 rounded bg-slate-200" />
                <div className="grid gap-2 md:grid-cols-3">
                    <div className="h-10 rounded-lg bg-slate-100" />
                    <div className="h-10 rounded-lg bg-slate-100" />
                    <div className="h-10 rounded-lg bg-slate-100" />
                </div>
            </section>
            <section className="rounded-2xl border border-slate-100 bg-white p-4 h-40" />
            <section className="space-y-2">
                {Array.from({ length: 4 }, (_, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 h-24" />
                ))}
            </section>
        </div>
    );
}

export default function AdminSecurityPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [records, setRecords] = useState<LoginAttempt[]>([]);
    const [windowMinutes, setWindowMinutes] = useState('60');
    const [outcome, setOutcome] = useState('all');
    const [email, setEmail] = useState('');

    const loadAttempts = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.set('page', '1');
            params.set('pageSize', '100');
            params.set('windowMinutes', windowMinutes);
            if (outcome !== 'all') params.set('outcome', outcome);
            if (email.trim()) params.set('email', email.trim().toLowerCase());

            const response = await fetch(`/api/admin/auth/login-attempts?${params.toString()}`, { cache: 'no-store' });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Unable to load login attempts.');
            }

            setRecords(Array.isArray(payload.data) ? payload.data : []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to load login attempts.';
            setError(message);
            notifyError(showToast, err, message);
        } finally {
            setLoading(false);
        }
    }, [email, outcome, showToast, windowMinutes]);

    useEffect(() => {
        void loadAttempts();
    }, [loadAttempts]);

    const failedCounts = useMemo(() => {
        const counts = new Map<string, number>();

        for (const row of records) {
            if (!row.succeeded) {
                const key = `${row.email}::${row.ip}`;
                counts.set(key, (counts.get(key) ?? 0) + 1);
            }
        }

        return Array.from(counts.entries())
            .map(([key, count]) => {
                const [rowEmail, rowIp] = key.split('::');
                return {
                    key,
                    email: rowEmail,
                    ip: rowIp,
                    failedCount: count,
                    isLocked: count >= MAX_FAILED_ATTEMPTS,
                };
            })
            .sort((a, b) => b.failedCount - a.failedCount)
            .slice(0, 8);
    }, [records]);

    if (loading) {
        return <SecurityPageSkeleton />;
    }

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-100 bg-white p-4 md:p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gray">Security</p>
                <h1 className="mt-1 text-2xl font-bold text-brand-navy">Admin login attempts</h1>
                <p className="mt-2 text-sm text-brand-gray">Monitor suspicious login patterns and lockout pressure by email/IP.</p>

                <div className="mt-4 grid gap-2 md:grid-cols-3">
                    <select value={windowMinutes} onChange={(event) => setWindowMinutes(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-brand-navy">
                        {WINDOW_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-brand-navy">
                        {OUTCOME_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Filter by email"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-brand-navy"
                    />
                </div>
            </section>

            {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <section className="rounded-2xl border border-slate-100 bg-white p-4">
                <h2 className="text-sm font-bold text-brand-navy">High-risk login sources</h2>
                {failedCounts.length === 0 ? (
                    <p className="mt-2 text-sm text-brand-gray">No failed attempts in this window.</p>
                ) : (
                    <div className="mt-3 grid gap-2">
                        {failedCounts.map((entry) => (
                            <div key={entry.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                                <p className="font-semibold text-brand-navy">{entry.email}</p>
                                <p className="mt-1">IP: {entry.ip}</p>
                                <p className="mt-1">Failed attempts: {entry.failedCount}</p>
                                <p className={`mt-1 font-semibold ${entry.isLocked ? 'text-red-600' : 'text-amber-600'}`}>
                                    {entry.isLocked ? 'Lockout threshold reached' : 'Below lockout threshold'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="space-y-3">
                {records.length === 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-brand-gray">No login attempts found for the current filters.</div>
                ) : records.map((record) => (
                    <article key={record.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold text-brand-navy">{record.email}</p>
                                <p className="mt-1 text-xs text-brand-gray">IP: {record.ip}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-xs font-semibold ${record.succeeded ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {record.succeeded ? 'Succeeded' : 'Failed'}
                                </p>
                                <p className="mt-1 text-xs text-brand-gray">{new Date(record.attempted_at).toLocaleString('en-NG')}</p>
                            </div>
                        </div>

                        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-700 break-all">
                            User-Agent: {record.user_agent || 'Not captured'}
                        </p>
                    </article>
                ))}
            </section>
        </div>
    );
}