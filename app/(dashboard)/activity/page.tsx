'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Loader2, Search } from 'lucide-react';

type TransactionRow = {
    id: string;
    type: 'contribution' | 'payout';
    amount: number;
    status: 'pending' | 'success' | 'failed';
    reference: string;
    created_at: string;
    groups?: {
        id: string;
        name: string;
    } | null;
};

export default function ActivityPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'contribution' | 'payout'>('all');
    const [transactions, setTransactions] = useState<TransactionRow[]>([]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');

            try {
                const res = await fetch('/api/transactions?page=1&pageSize=100', { cache: 'no-store' });
                const json = await res.json();

                if (!res.ok) {
                    throw new Error(json.error || 'Failed to load activity.');
                }

                setTransactions(Array.isArray(json.data) ? json.data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load activity.');
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, []);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        return transactions.filter((tx) => {
            const typeMatch = filter === 'all' || tx.type === filter;
            const searchMatch =
                !query ||
                tx.reference.toLowerCase().includes(query) ||
                (tx.groups?.name ?? '').toLowerCase().includes(query);
            return typeMatch && searchMatch;
        });
    }, [transactions, filter, search]);

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            <div>
                <h1 className="text-xl font-bold text-brand-navy">Activity</h1>
                <p className="text-xs text-brand-gray">Live transaction feed from payment records</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-1 rounded-xl bg-white border border-slate-100 p-1 w-fit">
                    {(['all', 'contribution', 'payout'] as const).map((item) => (
                        <button
                            key={item}
                            onClick={() => setFilter(item)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize ${filter === item ? 'bg-brand-navy text-white' : 'text-brand-gray'
                                }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by group or reference"
                        className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                </div>
            </div>

            {loading ? (
                <div className="min-h-80 grid place-items-center text-brand-gray">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Loader2 className="animate-spin" size={16} />
                        Loading activity...
                    </div>
                </div>
            ) : error ? (
                <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 p-3 text-sm font-semibold">{error}</div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-slate-100 bg-white p-5 text-sm text-brand-gray">No transactions found.</div>
            ) : (
                <div className="rounded-2xl border border-slate-100 bg-white divide-y divide-slate-50 overflow-hidden">
                    {filtered.map((tx) => {
                        const isContribution = tx.type === 'contribution';
                        return (
                            <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className={`h-9 w-9 rounded-xl grid place-items-center ${isContribution ? 'bg-brand-primary/10 text-brand-primary' : 'bg-emerald-50 text-emerald-600'
                                            }`}
                                    >
                                        {isContribution ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-brand-navy truncate">{tx.groups?.name ?? 'Group'}</p>
                                        <p className="text-[11px] text-brand-gray truncate">
                                            {new Date(tx.created_at).toLocaleString()} · {tx.reference}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${isContribution ? 'text-brand-navy' : 'text-emerald-600'}`}>
                                        {isContribution ? '-' : '+'}NGN {Number(tx.amount).toLocaleString('en-NG')}
                                    </p>
                                    <p className="text-[11px] text-brand-gray capitalize">{tx.status}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
