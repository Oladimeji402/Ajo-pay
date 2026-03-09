'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Loader2, Users, Wallet } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Profile = {
    name: string;
    wallet_balance: number;
    total_contributed: number;
    total_received: number;
};

type Group = {
    id: string;
    name: string;
    contribution_amount: number;
    frequency: string;
    status: string;
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
    const [profile, setProfile] = useState<Profile | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

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

                const [profileRes, groupsRes, txRes] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('name, wallet_balance, total_contributed, total_received')
                        .eq('id', user.id)
                        .maybeSingle(),
                    fetch('/api/groups', { cache: 'no-store' }),
                    fetch('/api/transactions?page=1&pageSize=5', { cache: 'no-store' }),
                ]);

                if (profileRes.error) {
                    throw new Error(profileRes.error.message);
                }

                const groupsJson = await groupsRes.json();
                const txJson = await txRes.json();

                if (!groupsRes.ok) {
                    throw new Error(groupsJson.error || 'Failed to load groups.');
                }

                if (!txRes.ok) {
                    throw new Error(txJson.error || 'Failed to load transactions.');
                }

                setProfile((profileRes.data as Profile) ?? null);
                setGroups(Array.isArray(groupsJson.data) ? groupsJson.data : []);
                setTransactions(Array.isArray(txJson.data) ? txJson.data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, []);

    const activeGroups = useMemo(() => groups.filter((group) => group.status === 'active').length, [groups]);

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
        <div className="max-w-4xl mx-auto space-y-5">
            <div>
                <h1 className="text-xl font-bold text-brand-navy">Welcome, {profile?.name || 'Member'}</h1>
                <p className="text-xs text-brand-gray">Your live savings overview</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                    <p className="text-xs text-brand-gray mb-1 flex items-center gap-1"><Wallet size={12} /> Wallet Balance</p>
                    <p className="text-lg font-bold text-brand-navy">NGN {Number(profile?.wallet_balance ?? 0).toLocaleString('en-NG')}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                    <p className="text-xs text-brand-gray mb-1">Total Contributed</p>
                    <p className="text-lg font-bold text-brand-navy">NGN {Number(profile?.total_contributed ?? 0).toLocaleString('en-NG')}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                    <p className="text-xs text-brand-gray mb-1 flex items-center gap-1"><Users size={12} /> Active Groups</p>
                    <p className="text-lg font-bold text-brand-navy">{activeGroups}</p>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-brand-navy">Recent Transactions</h2>
                    <Link href="/activity" className="text-xs font-bold text-brand-primary">View all</Link>
                </div>
                {transactions.length === 0 ? (
                    <p className="text-sm text-brand-gray">No transactions yet.</p>
                ) : (
                    <div className="space-y-2">
                        {transactions.map((tx) => {
                            const isContribution = tx.type === 'contribution';
                            return (
                                <div key={tx.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-8 w-8 rounded-lg grid place-items-center ${isContribution ? 'text-brand-primary bg-brand-primary/10' : 'text-emerald-600 bg-emerald-50'}`}>
                                            {isContribution ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-brand-navy">{tx.groups?.name ?? 'Group'}</p>
                                            <p className="text-[11px] text-brand-gray">{new Date(tx.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <p className={`text-sm font-bold ${isContribution ? 'text-brand-navy' : 'text-emerald-600'}`}>
                                        {isContribution ? '-' : '+'}NGN {Number(tx.amount).toLocaleString('en-NG')}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4">
                <h2 className="font-bold text-brand-navy mb-3">My Groups</h2>
                {groups.length === 0 ? (
                    <p className="text-sm text-brand-gray">You are not in any groups yet.</p>
                ) : (
                    <div className="space-y-2">
                        {groups.slice(0, 4).map((group) => (
                            <Link key={group.id} href={`/groups/${group.id}`} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-brand-navy">{group.name}</p>
                                    <p className="text-[11px] text-brand-gray">NGN {Number(group.contribution_amount).toLocaleString('en-NG')} · {group.frequency}</p>
                                </div>
                                <span className="text-[11px] font-bold text-brand-gray capitalize">{group.status}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
