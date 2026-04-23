'use client';

import React, { useMemo, useState } from 'react';
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
    Landmark,
    Phone,
    Wallet,
    Target,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useData } from '@/lib/hooks/useData';

type Profile = {
    name: string;
    phone: string | null;
    bank_account: string | null;
    wallet_balance: number;
    total_contributed: number;
    total_received: number;
};

type Transaction = {
    id: string;
    type: 'contribution' | 'payout' | 'individual_savings' | 'bulk_contribution' | 'passbook_activation' | 'wallet_funding';
    amount: number;
    status: string;
    created_at: string;
    groups?: { id: string; name: string } | null;
    metadata?: Record<string, unknown> | null;
};

type DashboardData = {
    profile: Profile | null;
    transactions: Transaction[];
    individualSavingsTotal: number;
};

async function fetchDashboard(): Promise<DashboardData> {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Please log in to view your dashboard.');

    const [profileRes, transactionsRes, savingsRes] = await Promise.all([
        supabase
            .from('profiles')
            .select('name, phone, bank_account, wallet_balance, total_contributed, total_received')
            .eq('id', user.id)
            .maybeSingle(),
        fetch('/api/transactions?page=1&pageSize=8'),
        fetch('/api/savings/goals'),
    ]);

    if (profileRes.error) throw new Error(profileRes.error.message);

    const txJson = await transactionsRes.json();
    if (!transactionsRes.ok) throw new Error(txJson.error || 'Failed to load transactions.');

    let individualSavingsTotal = 0;
    if (savingsRes.ok) {
        const savingsJson = await savingsRes.json();
        individualSavingsTotal = (Array.isArray(savingsJson.data) ? savingsJson.data : [])
            .reduce((sum: number, g: { total_saved: number }) => sum + Number(g.total_saved ?? 0), 0);
    }

    return {
        profile: (profileRes.data as Profile) ?? null,
        transactions: Array.isArray(txJson.data) ? txJson.data : [],
        individualSavingsTotal,
    };
}

export default function DashboardPage() {
    const [activityFilter, setActivityFilter] = useState<'all' | 'contribution' | 'payout'>('all');
    const [savedVisible, setSavedVisible] = useState(true);

    const { data, loading, error } = useData<DashboardData>('dashboard', fetchDashboard, { ttl: 30_000 });

    const profile = data?.profile ?? null;
    const transactions = data?.transactions ?? [];
    const individualSavingsTotal = data?.individualSavingsTotal ?? 0;

    const filteredActivity = useMemo(() => {
        if (activityFilter === 'all') return transactions;
        return transactions.filter((tx) => tx.type === activityFilter);
    }, [activityFilter, transactions]);

    const formatCurrency = (value: number) => Number(value).toLocaleString('en-NG');

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

    if (error && !data) {
        return <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>;
    }

    const quickActions = [
        {
            href: '/wallet',
            icon: Wallet,
            label: 'Fund Wallet',
            bg: 'bg-blue-50',
            color: 'text-blue-600',
            badge: undefined,
            onClick: undefined,
        },
        {
            href: '/pay',
            icon: CreditCard,
            label: 'Pay Now',
            bg: 'bg-brand-primary',
            color: 'text-white',
            badge: undefined,
            onClick: undefined,
        },
        {
            href: '/savings',
            icon: Target,
            label: 'Savings',
            bg: 'bg-emerald-50',
            color: 'text-emerald-600',
            badge: undefined,
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
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Balance Overview */}
            <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#060E3A] via-[#0D2185] to-brand-primary p-5 text-white">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-14 -left-6 h-44 w-44 rounded-full bg-blue-300/15 blur-3xl pointer-events-none" />

                {/* Wallet balance — full width card */}
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Wallet size={12} className="text-white/60" />
                            <span className="text-[11px] font-medium text-white/70">Wallet Balance</span>
                        </div>
                        <button
                            onClick={() => setSavedVisible((v) => !v)}
                            className="text-white/50 transition-colors hover:text-white/90"
                            aria-label={savedVisible ? 'Hide total saved' : 'Show total saved'}
                        >
                            {savedVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                    </div>
                    <p className="text-[18px] font-semibold leading-snug tracking-normal text-white/90">
                        {savedVisible ? (
                            <>
                                <span className="font-normal">₦</span>
                                {formatCurrency(profile?.wallet_balance ?? 0)}
                            </>
                        ) : '••••••'}
                    </p>
                </div>

                {/* Stats chips */}
                <div className="relative mt-4 flex flex-wrap items-center gap-2">
                    {individualSavingsTotal > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/20 px-2.5 py-1 text-[11px] text-amber-300">
                            <AlertTriangle size={11} /> Individual savings active
                        </span>
                    )}
                </div>
            </section>

            {/* Quick Actions */}
            <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="grid grid-cols-4 gap-2">
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

            {/* Profile completion nudge card */}
            {(() => {
                const items = [
                    {
                        done: !!profile?.phone,
                        icon: Phone,
                        label: 'Add your phone number',
                        sub: 'Get WhatsApp payment receipts',
                        href: '/settings',
                    },
                    {
                        done: !!profile?.bank_account,
                        icon: Landmark,
                        label: 'Link a bank account',
                        sub: 'Required to receive your payout',
                        href: '/settings?tab=bank',
                    },
                    {
                        done: individualSavingsTotal > 0,
                        icon: Target,
                        label: 'Create your first savings goal',
                        sub: 'Start your personal savings plan',
                        href: '/savings',
                    },
                ];
                const allDone = items.every((item) => item.done);
                if (allDone) return null;
                const completedCount = items.filter((item) => item.done).length;
                return (
                    <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-brand-navy">Complete your profile</p>
                                <p className="text-[11px] text-brand-gray">{completedCount}/{items.length} done</p>
                            </div>
                            <div className="flex gap-1">
                                {items.map((item, i) => (
                                    <div key={i} className={`h-1.5 w-6 rounded-full ${item.done ? 'bg-brand-primary' : 'bg-slate-200'}`} />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            {items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${item.done
                                                ? 'border-emerald-100 bg-white/60 opacity-60 pointer-events-none'
                                                : 'border-blue-100 bg-white hover:border-blue-200'
                                            }`}
                                    >
                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.done ? 'bg-emerald-50' : 'bg-brand-primary/10'
                                            }`}>
                                            {item.done
                                                ? <CheckCircle2 size={15} className="text-emerald-600" />
                                                : <Icon size={15} className="text-brand-primary" />
                                            }
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-xs font-semibold ${item.done ? 'text-slate-400 line-through' : 'text-brand-navy'}`}>{item.label}</p>
                                            <p className="text-[10px] text-brand-gray">{item.sub}</p>
                                        </div>
                                        {!item.done && <ChevronRight size={13} className="shrink-0 text-slate-300" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                );
            })()}

            <Link
                href="/savings"
                className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/50 p-4 transition-colors hover:bg-blue-50"
            >
                <div>
                    <p className="text-sm font-bold text-brand-navy">Grow your individual savings</p>
                    <p className="mt-0.5 text-[11px] text-brand-gray">Create goals and fund them on your own schedule</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary">
                    <ChevronRight size={16} className="text-white" />
                </div>
            </Link>

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
                                const isContributionLike = tx.type === 'contribution' || tx.type === 'individual_savings' || tx.type === 'bulk_contribution' || tx.type === 'passbook_activation';
                                const txLabel = tx.type === 'contribution'
                                    ? (tx.groups?.name ?? 'Group contribution')
                                    : tx.type === 'payout'
                                        ? (tx.groups?.name ? `${tx.groups.name} payout` : 'Payout')
                                        : tx.type === 'individual_savings'
                                            ? 'Individual savings'
                                            : tx.type === 'bulk_contribution'
                                                ? 'Bulk savings payment'
                                                : tx.type === 'wallet_funding'
                                                    ? 'Wallet funding'
                                                    : 'Passbook activation';
                                return (
                                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isContributionLike ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                                            {isContributionLike ? <ArrowUpRight size={16} className="text-blue-600" /> : <ArrowDownLeft size={16} className="text-emerald-600" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-brand-navy">{txLabel}</p>
                                            <p className="text-[10px] text-brand-gray">
                                                {new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${isContributionLike ? 'text-brand-navy' : 'text-emerald-600'}`}>
                                                {(isContributionLike && tx.type !== 'wallet_funding') ? '-' : '+'}{formatCurrency(tx.amount)}
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
