'use client';

import React from 'react';
import { CircleDollarSign, HandCoins, UserPlus, Users } from 'lucide-react';

type ActivityType = 'contribution' | 'payout' | 'signup' | 'group';

type ActivityItem = {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    timestamp: string;
};

type ActivityFeedProps = {
    activities: ActivityItem[];
    loading?: boolean;
};

function formatRelativeTime(timestamp: string) {
    const value = new Date(timestamp).getTime();
    if (!Number.isFinite(value)) return 'just now';

    const diffSeconds = Math.max(0, Math.floor((Date.now() - value) / 1000));

    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
}

function ActivityIcon({ type }: { type: ActivityType }) {
    if (type === 'contribution') {
        return <CircleDollarSign size={16} className="text-emerald-600" />;
    }

    if (type === 'payout') {
        return <HandCoins size={16} className="text-amber-600" />;
    }

    if (type === 'signup') {
        return <UserPlus size={16} className="text-sky-600" />;
    }

    return <Users size={16} className="text-indigo-600" />;
}

export function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
    return (
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-brand-navy">Live Activity</h3>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Realtime</span>
            </div>

            <div className="max-h-105 space-y-2 overflow-y-auto pr-1">
                {loading ? (
                    <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Loading activity...</p>
                ) : null}

                {!loading && activities.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No activity yet.</p>
                ) : null}

                {!loading
                    ? activities.slice(0, 15).map((item) => (
                        <article key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 rounded-lg bg-white p-2" aria-hidden="true">
                                    <ActivityIcon type={item.type} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-brand-navy">{item.title}</p>
                                    <p className="mt-0.5 text-sm text-slate-600">{item.description}</p>
                                    <p className="mt-1 text-xs font-medium text-slate-500">{formatRelativeTime(item.timestamp)}</p>
                                </div>
                            </div>
                        </article>
                    ))
                    : null}
            </div>
        </section>
    );
}
