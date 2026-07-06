'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowLeft, Banknote } from 'lucide-react';

type UserActivity = {
    id: string;
    type: 'target_contribution' | 'general_deposit' | 'general_payout' | string;
    status: string;
    title: string;
    description: string;
    amount: number | null;
    occurredAt: string;
};

function ActivitySkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }, (_, idx) => (
                <div key={idx} className="h-24 rounded-xl bg-slate-100" />
            ))}
        </div>
    );
}

export default function UserActivityPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userName, setUserName] = useState('');
    const [activities, setActivities] = useState<UserActivity[]>([]);

    const loadActivities = useCallback(async () => {
        const res = await fetch(`/api/admin/users/${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load user.');
        
        setUserName(json.data?.name || json.data?.email || 'User');
        setActivities(Array.isArray(json.recentActivity) ? json.recentActivity : []);
    }, [id]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');
            try {
                await loadActivities();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load activities.');
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, [id, loadActivities]);

    if (loading) return <ActivitySkeleton />;
    if (error) return <div className="text-sm text-red-600">{error}</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Link 
                    href={`/admin/users/${id}`} 
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gray transition-colors hover:text-brand-navy"
                >
                    <ArrowLeft size={14} /> Back to user profile
                </Link>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-brand-navy">Activity History</h1>
                        <p className="mt-1 text-sm text-brand-gray">{userName} · {activities.length} total activities</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                        <Activity size={12} className="text-emerald-600" /> All activities
                    </div>
                </div>

                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                        <Activity size={40} className="text-slate-300" />
                        <p className="mt-3 text-sm font-semibold text-slate-600">No activities found</p>
                        <p className="mt-1 text-xs text-slate-400">This user hasn&apos;t performed any activities yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activities.map((item) => (
                            <div 
                                key={item.id} 
                                className="rounded-xl border border-slate-200/70 bg-gradient-to-r from-white to-slate-50 p-3 shadow-sm transition hover:border-slate-300 hover:shadow"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-brand-navy">{item.title}</p>
                                        <p className="mt-1 text-xs text-brand-gray">{item.description}</p>
                                        <p className="mt-1 text-xs text-brand-gray">
                                            {new Date(item.occurredAt).toLocaleString('en-NG', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-gray">
                                            {item.type.replace('_', ' ')}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold capitalize text-brand-navy">{item.status}</p>
                                        {item.amount !== null ? (
                                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                                                <Banknote size={12} /> NGN {Number(item.amount).toLocaleString('en-NG')}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
