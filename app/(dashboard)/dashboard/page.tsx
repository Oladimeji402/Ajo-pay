'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Eye,
    EyeOff,
    FileText,
    Search,
    Share2,
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
    const [savedVisible, setSavedVisible] = useState(true);
    const [receivedVisible, setReceivedVisible] = useState(true);
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
            <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
                <div className="rounded-3xl bg-slate-200 h-44" />
                <div className="rounded-3xl bg-white border border-slate-100 h-24" />
                <div className="rounded-2xl bg-white border border-slate-100 h-28" />
                <div className="rounded-2xl bg-white border border-slate-100 h-48" />
                <div className="rounded-2xl bg-white border border-slate-100 h-40" />
            </div>
        );
    }

    if (error) {
        return <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>;
    }

    // First group the user is in (for invite sharing)
    const firstGroupId = groups[0]?.id ?? null;

    const quickActions = [
        {
            href: actionQueue.length > 0 ? `/groups/${actionQueue[0]?.id}` : '/groups',
            icon: CreditCard,
            label: 'Pay Now',
            bg: 'bg-brand-primary',
            color: 'text-white',
            badge: actionQueue.length > 0 ? actionQueue.length : undefined,
            onClick: undefined,
        },
        {
            href: '/groups',
            icon: Search,
            label: 'Find Group',
            bg: 'bg-purple-50',
            color: 'text-purple-600',
            badge: undefined,
            onClick: undefined,
        },
        {
            href: firstGroupId ? `/groups/${firstGroupId}` : '/groups',
            icon: Users,
            label: 'My Groups',
            bg: 'bg-emerald-50',
            color: 'text-emerald-600',
            badge: groups.length > 0 ? groups.length : undefined,
            onClick: undefined,
        },
        {
            href: '/activity',
            icon: FileText,
            label: 'Statement',
            bg: 'bg-amber-50',
            color: 'text-amber-600',
            badge: undefined,
            onClick: undefined,
        },
        {
            href: firstGroupId ? `/groups/${firstGroupId}` : '/groups',
            icon: Share2,
            label: 'Invite',
            bg: 'bg-sky-50',
            color: 'text-sky-600',
            badge: undefined,
            onClick: undefined,
        },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Balance Overview */}
            <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#060E3A] via-[#0D2185] to-brand-primary p-5 text-white">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-14 -left-6 h-44 w-44 rounded-full bg-blue-300/15 blur-3xl pointer-events-none" />

                <p className="relative text-[11px] font-medium text-white/60 mb-4">Your savings overview</p>

                <div className="relative grid grid-cols-2 gap-3">
                    {/* Total Saved */}
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm">
                        <div className="mb-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Wallet size={12} className="text-white/60" />
                                <span className="text-[11px] font-medium text-white/70">Total Saved</span>
                            </div>
                            <button
                                onClick={() => setSavedVisible((v) => !v)}
                                className="text-white/50 transition-colors hover:text-white/90"
                                aria-label={savedVisible ? 'Hide total saved' : 'Show total saved'}
                            >
                                {savedVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>
                        </div>
                        <p className="text-[17px] font-bold leading-tight tracking-tight">
                            {savedVisible ? formatCurrency(profile?.total_contributed ?? 0) : '••••••'}
                        </p>
                        <p className="mt-1 text-[10px] text-white/40">Contributions</p>
                    </div>

                    {/* Money Received */}
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm">
                        <div className="mb-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <ArrowDownLeft size={12} className="text-white/60" />
                                <span className="text-[11px] font-medium text-white/70">Received</span>
                            </div>
                            <button
                                onClick={() => setReceivedVisible((v) => !v)}
                                className="text-white/50 transition-colors hover:text-white/90"
                                aria-label={receivedVisible ? 'Hide received amount' : 'Show received amount'}
                            >
                                {receivedVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>
                        </div>
                        <p className="text-[17px] font-bold leading-tight tracking-tight">
                            {receivedVisible ? formatCurrency(profile?.total_received ?? 0) : '••••••'}
                        </p>
                        <p className="mt-1 text-[10px] text-white/40">Payout earnings</p>
                    </div>
                </div>

                {/* Stats chips */}
                <div className="relative mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-white/80">
                        <Users size={11} /> {activeGroups} active group{activeGroups !== 1 ? 's' : ''}
                    </span>
                    {groupsAwaitingContribution > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/20 px-2.5 py-1 text-[11px] text-amber-300">
                            <AlertTriangle size={11} /> {groupsAwaitingContribution} payment{groupsAwaitingContribution !== 1 ? 's' : ''} due
                        </span>
                    )}
                </div>
            </section>

            {/* Quick Actions */}
            <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="grid grid-cols-5 gap-1">
                    {quickActions.map(({ href, icon: Icon, label, bg, color, badge }) => (
                        <Link key={label} href={href} className="group flex flex-col items-center gap-1.5 px-1">
                            <div className="relative">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg} transition-all duration-150 group-active:scale-90`}>
                                    <Icon size={20} className={color} />
                                </div>
                                {badge !== undefined && badge > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                                        {badge > 9 ? '9+' : badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-center text-[10px] font-semibold leading-tight text-slate-600">{label}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Payments Due */}
            {actionQueue.length > 0 ? (
                <section>
                    <div className="mb-2.5 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-brand-navy">Payments Due</h2>
                        <Link href="/groups" className="text-[11px] font-semibold text-brand-primary">See all</Link>
                    </div>
                    <div className="space-y-2.5">
                        {actionQueue.map((group) => {
                            const state = currentCycleStatusByGroup.get(group.id) ?? 'due';
                            const dueDate = getCurrentCycleDueDate(group);
                            const dueWindow = getDueWindow(dueDate);
                            const isUrgent = state === 'overdue' || state === 'failed';
                            return (
                                <div
                                    key={group.id}
                                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 ${isUrgent ? 'border-rose-200 bg-rose-50/60' : 'border-amber-200 bg-amber-50/60'}`}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-brand-navy">{group.name}</p>
                                        <p className="mt-0.5 text-[11px] text-brand-gray">
                                            Round {group.current_cycle}/{group.total_cycles} · {formatCurrency(group.contribution_amount)}
                                        </p>
                                        <p className="mt-1 text-[10px] text-brand-gray">
                                            {isUrgent && state === 'overdue' ? (
                                                <span className="font-semibold text-rose-600">{dueWindow.daysOverdue}d overdue</span>
                                            ) : (
                                                `Due: ${formatScheduleDate(dueDate)}`
                                            )}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/groups/${group.id}`}
                                        className={`inline-flex shrink-0 items-center justify-center rounded-xl px-3 py-2 text-[11px] font-bold text-white transition-colors ${isUrgent ? 'bg-rose-500 hover:bg-rose-600' : 'bg-brand-primary hover:bg-brand-primary-hover'}`}
                                    >
                                        {state === 'failed' ? 'Retry' : 'Pay Now'}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ) : (
                <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                    <span className="font-semibold">All caught up!</span>
                    <span className="text-xs text-emerald-700">No payments due right now.</span>
                </div>
            )}

            {/* My Groups */}
            {groups.length > 0 ? (
                <section>
                    <div className="mb-2.5 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-brand-navy">My Groups</h2>
                        <Link href="/groups" className="text-[11px] font-semibold text-brand-primary">See all</Link>
                    </div>
                    <div className="space-y-2.5">
                        {groups.slice(0, 3).map((group) => {
                            const rawProgress = Number(group.current_cycle) / Math.max(Number(group.total_cycles), 1);
                            const progress = Math.max(0, Math.min(100, Math.round(rawProgress * 100)));
                            const state = currentCycleStatusByGroup.get(group.id) ?? 'due';
                            return (
                                <Link
                                    key={group.id}
                                    href={`/groups/${group.id}`}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-slate-300"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                                        <Users size={18} className="text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1.5 flex items-center justify-between gap-2">
                                            <p className="truncate text-sm font-semibold text-brand-navy">{group.name}</p>
                                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${getContributionStateStyle(state)}`}>
                                                {getContributionStateLabel(state)}
                                            </span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-blue-100">
                                            <div
                                                className="h-full rounded-full bg-linear-to-r from-brand-primary to-brand-electric transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <div className="mt-1 flex items-center justify-between">
                                            <p className="text-[10px] capitalize text-brand-gray">{group.frequency}</p>
                                            <p className="text-[10px] text-brand-gray">{group.current_cycle}/{group.total_cycles} rounds</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="shrink-0 text-slate-300" />
                                </Link>
                            );
                        })}
                    </div>
                </section>
            ) : (
                <Link
                    href="/groups"
                    className="flex items-center justify-between rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-4 transition-colors hover:bg-blue-50"
                >
                    <div>
                        <p className="text-sm font-bold text-brand-navy">Join a savings group</p>
                        <p className="mt-0.5 text-[11px] text-brand-gray">Start saving with friends and family</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary">
                        <Search size={16} className="text-white" />
                    </div>
                </Link>
            )}

            {/* Recent Activity */}
            {transactions.length > 0 && (
                <section>
                    <div className="mb-2.5 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-brand-navy">Recent Activity</h2>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-0.5">
                                {(['all', 'contribution', 'payout'] as const).map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => setActivityFilter(item)}
                                        className={`rounded-lg px-2 py-1 text-[10px] font-semibold capitalize transition-colors ${activityFilter === item ? 'bg-white text-brand-navy shadow-xs' : 'text-brand-gray'}`}
                                    >
                                        {item === 'all' ? 'All' : item === 'contribution' ? 'Sent' : 'Received'}
                                    </button>
                                ))}
                            </div>
                            <Link href="/activity" className="text-[11px] font-semibold text-brand-primary">See all</Link>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
                        {filteredActivity.length === 0 ? (
                            <p className="p-4 text-sm text-brand-gray">No transactions found.</p>
                        ) : (
                            filteredActivity.slice(0, 5).map((tx) => {
                                const isContribution = tx.type === 'contribution';
                                return (
                                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isContribution ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                                            {isContribution ? <ArrowUpRight size={16} className="text-blue-600" /> : <ArrowDownLeft size={16} className="text-emerald-600" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-brand-navy">{tx.groups?.name ?? 'Group'}</p>
                                            <p className="text-[10px] text-brand-gray">
                                                {new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${isContribution ? 'text-brand-navy' : 'text-emerald-600'}`}>
                                                {isContribution ? '-' : '+'}{formatCurrency(tx.amount)}
                                            </p>
                                            <p className="text-[10px] capitalize text-brand-gray">{tx.status}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
