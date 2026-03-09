'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type AdminStats = {
    totalUsers: number;
    activeGroups: number;
    pendingPayouts: number;
    totalVolume: number;
};

type PayoutRow = {
    id: string;
    status: string;
    amount: number;
    cycle_number: number;
    groups?: { id: string; name: string } | null;
    profiles?: { id: string; name: string; email: string; phone?: string | null } | null;
};

type TxRow = {
    id: string;
    type: string;
    status: string;
    amount: number;
    reference: string;
    created_at: string;
    groups?: { id: string; name: string } | null;
    profiles?: { id: string; name: string; email: string } | null;
};

export default function AdminOverviewPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [payouts, setPayouts] = useState<PayoutRow[]>([]);
    const [transactions, setTransactions] = useState<TxRow[]>([]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');

            try {
                const [statsRes, payoutsRes, txRes] = await Promise.all([
                    fetch('/api/admin/stats', { cache: 'no-store' }),
                    fetch('/api/admin/payouts?status=pending', { cache: 'no-store' }),
                    fetch('/api/admin/transactions?page=1&pageSize=8', { cache: 'no-store' }),
                ]);

                const [statsJson, payoutsJson, txJson] = await Promise.all([statsRes.json(), payoutsRes.json(), txRes.json()]);

                if (!statsRes.ok) throw new Error(statsJson.error || 'Failed to load stats.');
                if (!payoutsRes.ok) throw new Error(payoutsJson.error || 'Failed to load payouts.');
                if (!txRes.ok) throw new Error(txJson.error || 'Failed to load transactions.');

                setStats(statsJson.data as AdminStats);
                setPayouts(Array.isArray(payoutsJson.data) ? payoutsJson.data : []);
                setTransactions(Array.isArray(txJson.data) ? txJson.data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load admin dashboard.');
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, []);

    if (loading) {
        return <div className="min-h-80 grid place-items-center text-sm text-brand-gray"><Loader2 className="animate-spin" size={16} /></div>;
    }

    if (error || !stats) {
        return <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 p-4 text-sm font-semibold">{error || 'No data'}</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-brand-navy">Admin Overview</h1>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Total Users</p><p className="text-2xl font-bold text-brand-navy">{stats.totalUsers}</p></div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Active Groups</p><p className="text-2xl font-bold text-brand-navy">{stats.activeGroups}</p></div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Pending Payouts</p><p className="text-2xl font-bold text-brand-navy">{stats.pendingPayouts}</p></div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Total Volume</p><p className="text-2xl font-bold text-brand-navy">NGN {Number(stats.totalVolume).toLocaleString('en-NG')}</p></div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-brand-navy">Pending Payouts</h2>
                        <Link href="/admin/payouts" className="text-xs font-semibold text-brand-primary">View all</Link>
                    </div>
                    <div className="space-y-2">
                        {payouts.slice(0, 6).map((payout) => (
                            <div key={payout.id} className="rounded-xl bg-slate-50 p-3 text-sm flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-brand-navy">{payout.profiles?.name || payout.profiles?.email || 'Recipient'}</p>
                                    <p className="text-xs text-brand-gray">{payout.groups?.name || 'Group'} · Cycle {payout.cycle_number}</p>
                                </div>
                                <p className="font-bold text-brand-navy">NGN {Number(payout.amount).toLocaleString('en-NG')}</p>
                            </div>
                        ))}
                        {payouts.length === 0 && <p className="text-sm text-brand-gray">No pending payouts.</p>}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-brand-navy">Recent Transactions</h2>
                        <Link href="/admin/transactions" className="text-xs font-semibold text-brand-primary">View all</Link>
                    </div>
                    <div className="space-y-2">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="rounded-xl bg-slate-50 p-3 text-sm flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-brand-navy">{tx.profiles?.name || tx.profiles?.email || 'User'} · {tx.groups?.name || 'Group'}</p>
                                    <p className="text-xs text-brand-gray">{tx.reference} · {new Date(tx.created_at).toLocaleString()}</p>
                                </div>
                                <p className="font-bold text-brand-navy">{tx.type === 'contribution' ? '-' : '+'}NGN {Number(tx.amount).toLocaleString('en-NG')}</p>
                            </div>
                        ))}
                        {transactions.length === 0 && <p className="text-sm text-brand-gray">No transactions found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
