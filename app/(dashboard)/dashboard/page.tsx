'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    CircleDashed,
    Clock3,
    Loader2,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { notifyError } from '@/lib/toast';
import { formatScheduleDate, getCurrentCycleDueDate, getDueWindow } from '@/lib/ajo-schedule';

type Profile = {
    name: string;
    total_contributed: number;
    total_received: number;
};

type Group = {
    id: string;
    name: string;
    contribution_amount: number;
    frequency: string;
    status: string;
    current_cycle: number;
    total_cycles: number;
    start_date: string | null;
};

type Contribution = {
    id: string;
    group_id: string;
    cycle_number: number;
    amount: number;
    status: 'pending' | 'success' | 'failed';
    created_at: string;
};

type Transaction = {
    id: string;
    type: 'contribution' | 'payout';
    amount: number;
    status: string;
    created_at: string;
    groups?: { id: string; name: string } | null;
};

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activityFilter, setActivityFilter] = useState<'all' | 'contribution' | 'payout'>('all');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');

            try {
                const supabase = createSupabaseBrowserClient();
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    setError('Please log in to view your dashboard.');
                    return;
                }

                const [profileRes, groupsRes, contributionsRes, transactionsRes] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('name, total_contributed, total_received')
                        .eq('id', user.id)
                        .maybeSingle(),
                    fetch('/api/groups', { cache: 'no-store' }),
                    fetch('/api/contributions', { cache: 'no-store' }),
                    fetch('/api/transactions?page=1&pageSize=8', { cache: 'no-store' }),
                ]);

                if (profileRes.error) {
                    throw new Error(profileRes.error.message);
                }

                const groupsJson = await groupsRes.json();
                const contributionsJson = await contributionsRes.json();
                const txJson = await transactionsRes.json();

                if (!groupsRes.ok) {
                    throw new Error(groupsJson.error || 'Failed to load groups.');
                }

                if (!contributionsRes.ok) {
                    throw new Error(contributionsJson.error || 'Failed to load contributions.');
                }

                if (!transactionsRes.ok) {
                    throw new Error(txJson.error || 'Failed to load transactions.');
                }

                setProfile((profileRes.data as Profile) ?? null);
                setGroups(Array.isArray(groupsJson.data) ? groupsJson.data : []);
                setContributions(Array.isArray(contributionsJson.data) ? contributionsJson.data : []);
                setTransactions(Array.isArray(txJson.data) ? txJson.data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
                notifyError(showToast, err, 'Failed to load dashboard. Please refresh.');
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [showToast]);

    const activeGroups = useMemo(() => groups.filter((group) => group.status === 'active').length, [groups]);

    const currentCycleStatusByGroup = useMemo(() => {
        const map = new Map<string, 'success' | 'pending' | 'failed' | 'scheduled' | 'due' | 'overdue'>();

        for (const group of groups) {
            const currentCycleContributions = contributions
                .filter((item) => item.group_id === group.id && item.cycle_number === group.current_cycle)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            if (currentCycleContributions.some((item) => item.status === 'success')) {
                map.set(group.id, 'success');
                continue;
            }

            if (currentCycleContributions.some((item) => item.status === 'pending')) {
                map.set(group.id, 'pending');
                continue;
            }

            if (currentCycleContributions.some((item) => item.status === 'failed')) {
                map.set(group.id, 'failed');
                continue;
            }

            const dueWindow = getDueWindow(getCurrentCycleDueDate(group));
            map.set(group.id, dueWindow.phase === 'overdue' ? 'overdue' : dueWindow.phase === 'scheduled' ? 'scheduled' : 'due');
        }

        return map;
    }, [contributions, groups]);

    const groupsAwaitingContribution = useMemo(() => {
        return groups.filter((group) => {
            const status = currentCycleStatusByGroup.get(group.id);
            return status === 'due' || status === 'overdue';
        }).length;
    }, [groups, currentCycleStatusByGroup]);

    const actionQueue = useMemo(() => {
        return groups
            .filter((group) => {
                const status = currentCycleStatusByGroup.get(group.id);
                return status === 'due' || status === 'failed' || status === 'overdue';
            })
            .sort((a, b) => Number(a.current_cycle) - Number(b.current_cycle));
    }, [groups, currentCycleStatusByGroup]);

    const filteredActivity = useMemo(() => {
        if (activityFilter === 'all') return transactions;
        return transactions.filter((tx) => tx.type === activityFilter);
    }, [activityFilter, transactions]);

    const momentumScore = useMemo(() => {
        if (groups.length === 0) return 0;

        const positiveStates = groups.reduce((sum, group) => {
            const state = currentCycleStatusByGroup.get(group.id);
            return sum + (state === 'success' ? 1 : 0);
        }, 0);

        return Math.round((positiveStates / groups.length) * 100);
    }, [currentCycleStatusByGroup, groups]);

    const formatCurrency = (value: number) => `NGN ${Number(value).toLocaleString('en-NG')}`;

    const getContributionStateLabel = (state: 'success' | 'pending' | 'failed' | 'scheduled' | 'due' | 'overdue') => {
        if (state === 'success') return 'Paid';
        if (state === 'pending') return 'Pending verification';
        if (state === 'failed') return 'Payment failed';
        if (state === 'scheduled') return 'Upcoming';
        if (state === 'overdue') return 'Overdue';
        return 'Due now';
    };

    const getContributionStateStyle = (state: 'success' | 'pending' | 'failed' | 'scheduled' | 'due' | 'overdue') => {
        if (state === 'success') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (state === 'pending') return 'bg-amber-50 text-amber-700 border-amber-100';
        if (state === 'failed') return 'bg-rose-50 text-rose-700 border-rose-100';
        if (state === 'scheduled') return 'bg-sky-50 text-sky-700 border-sky-100';
        if (state === 'overdue') return 'bg-rose-50 text-rose-700 border-rose-100';
        return 'bg-blue-50 text-blue-700 border-blue-100';
    };

    if (loading) {
        return (
            <div className="min-h-80 grid place-items-center text-brand-gray">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Loader2 className="animate-spin" size={16} />
                    Loading dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-brand-navy via-[#16214A] to-brand-emerald p-6 md:p-8 text-white">
                <div className="absolute -top-20 -right-14 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 font-semibold">Member Action Console</p>
                        <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
                            Savings Control Room
                        </h1>
                        <p className="text-sm text-white/80 max-w-xl">
                            {profile?.name || 'Member'}, your savings rhythm is at <span className="font-semibold text-white">{momentumScore}% momentum</span>. Focus on today&apos;s due cycles to keep payouts on track.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 min-w-60">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-2">Tonight&apos;s Checklist</p>
                        <div className="space-y-2 text-sm">
                            <p className="flex items-center justify-between gap-4">
                                <span className="inline-flex items-center gap-2"><CalendarClock size={14} /> Groups due</span>
                                <strong>{groupsAwaitingContribution}</strong>
                            </p>
                            <p className="flex items-center justify-between gap-4">
                                <span className="inline-flex items-center gap-2"><TrendingUp size={14} /> Active groups</span>
                                <strong>{activeGroups}</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] uppercase tracking-wide text-brand-gray mb-2 inline-flex items-center gap-1"><Wallet size={13} /> Contributed So Far</p>
                    <p className="text-xl font-semibold text-brand-navy">{formatCurrency(profile?.total_contributed ?? 0)}</p>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] uppercase tracking-wide text-brand-gray mb-2 inline-flex items-center gap-1"><ArrowDownLeft size={13} /> Received So Far</p>
                    <p className="text-xl font-semibold text-brand-navy">{formatCurrency(profile?.total_received ?? 0)}</p>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] uppercase tracking-wide text-brand-gray mb-2 inline-flex items-center gap-1"><Users size={13} /> Active Groups</p>
                    <p className="text-xl font-semibold text-brand-navy">{activeGroups}</p>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-linear-to-br from-amber-50 to-orange-50 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-amber-700 mb-2 inline-flex items-center gap-1"><AlertTriangle size={13} /> Awaiting My Contribution</p>
                    <p className="text-xl font-semibold text-amber-900">{groupsAwaitingContribution}</p>
                </article>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-brand-navy">Action Center</h2>
                        <p className="text-xs text-brand-gray">High-priority cycles that need your attention now.</p>
                    </div>
                    <Link href="/groups" className="text-xs font-bold text-brand-primary">Open all groups</Link>
                </div>

                <div className="p-4 md:p-5 space-y-3">
                    {actionQueue.length === 0 ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 inline-flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            You are clear for this cycle. No pending group payments.
                        </div>
                    ) : (
                        actionQueue.map((group) => {
                            const state = currentCycleStatusByGroup.get(group.id) ?? 'due';
                            const dueDate = getCurrentCycleDueDate(group);
                            const dueWindow = getDueWindow(dueDate);
                            return (
                                <div key={group.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-brand-navy truncate">{group.name}</p>
                                        <p className="text-xs text-brand-gray mt-0.5">
                                            Cycle {group.current_cycle} of {group.total_cycles} · {formatCurrency(group.contribution_amount)}
                                        </p>
                                        <p className="text-[11px] text-brand-gray mt-1">
                                            Collection date: {formatScheduleDate(dueDate)}
                                            {state === 'overdue' ? ` · ${dueWindow.daysOverdue} day${dueWindow.daysOverdue === 1 ? '' : 's'} late` : ''}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getContributionStateStyle(state)}`}>
                                            {state === 'pending' ? <Clock3 size={12} /> : state === 'failed' || state === 'overdue' ? <AlertTriangle size={12} /> : <CircleDashed size={12} />}
                                            {getContributionStateLabel(state)}
                                        </span>
                                        <Link href={`/groups/${group.id}`} className="inline-flex items-center justify-center rounded-lg bg-brand-navy px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-primary">
                                            {state === 'failed' ? 'Retry payment' : 'Pay now'}
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-brand-navy">Cycle Radar</h2>
                    <p className="text-xs text-brand-gray">A compact map of where each group stands in the current rotation.</p>
                </div>

                {groups.length === 0 ? (
                    <div className="p-5 text-sm text-brand-gray">You are not in any groups yet.</div>
                ) : (
                    <div className="p-4 md:p-5 grid gap-3 md:grid-cols-2">
                        {groups.map((group) => {
                            const rawProgress = Number(group.current_cycle) / Math.max(Number(group.total_cycles), 1);
                            const progress = Math.max(0, Math.min(100, Math.round(rawProgress * 100)));
                            const state = currentCycleStatusByGroup.get(group.id) ?? 'due';
                            const dueDate = getCurrentCycleDueDate(group);

                            return (
                                <Link key={group.id} href={`/groups/${group.id}`} className="rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-brand-navy">{group.name}</p>
                                            <p className="text-[11px] text-brand-gray mt-0.5 capitalize">{group.frequency} · {group.status}</p>
                                        </div>
                                        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${getContributionStateStyle(state)}`}>
                                            {getContributionStateLabel(state)}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-[11px] text-brand-gray">Collection date: {formatScheduleDate(dueDate)}</p>

                                    <div className="mt-4 space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] text-brand-gray">
                                            <span>Cycle progress</span>
                                            <span>{group.current_cycle} / {group.total_cycles}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full rounded-full bg-linear-to-r from-brand-primary to-brand-emerald" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                        <div>
                            <h2 className="text-base font-semibold text-brand-navy">Activity Timeline</h2>
                            <p className="text-xs text-brand-gray">Most recent records from verified payment activity.</p>
                        </div>
                        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                            {(['all', 'contribution', 'payout'] as const).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setActivityFilter(item)}
                                    className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold capitalize transition-colors ${activityFilter === item ? 'bg-white text-brand-navy shadow-xs' : 'text-brand-gray'}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 md:p-5 space-y-2">
                        {filteredActivity.length === 0 ? (
                            <p className="text-sm text-brand-gray">No transactions found for this filter.</p>
                        ) : (
                            filteredActivity.map((tx) => {
                                const isContribution = tx.type === 'contribution';
                                return (
                                    <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`h-8 w-8 rounded-lg grid place-items-center ${isContribution ? 'bg-brand-primary/10 text-brand-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {isContribution ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-brand-navy truncate">{tx.groups?.name ?? 'Group'}</p>
                                                <p className="text-[11px] text-brand-gray truncate">{new Date(tx.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-semibold ${isContribution ? 'text-brand-navy' : 'text-emerald-700'}`}>
                                                {isContribution ? '-' : '+'}{formatCurrency(tx.amount).replace('NGN ', 'NGN ')}
                                            </p>
                                            <p className="text-[10px] text-brand-gray capitalize">{tx.status}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-linear-to-b from-slate-50 to-white p-5">
                    <h3 className="text-sm font-semibold text-brand-navy">Quick Access</h3>
                    <p className="text-xs text-brand-gray mt-1">Jump to key screens without breaking focus.</p>

                    <div className="mt-4 space-y-2">
                        <Link href="/groups" className="block rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-navy hover:bg-slate-50">
                            Discover and join groups
                        </Link>
                        <Link href="/activity" className="block rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-navy hover:bg-slate-50">
                            Open full transaction history
                        </Link>
                        <Link href="/settings" className="block rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-navy hover:bg-slate-50">
                            Update payout bank settings
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
