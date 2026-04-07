'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const PAGE_SIZE = 20;

type TransactionRow = {
    id: string;
    type: 'contribution' | 'payout';
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'abandoned';
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
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Reset to page 1 when filter or search changes
    useEffect(() => {
        setPage(1);
    }, [filter, search]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');

            try {
                const typeParam = filter !== 'all' ? `&type=${filter}` : '';
                const res = await fetch(`/api/transactions?page=${page}&pageSize=${PAGE_SIZE}${typeParam}`, { cache: 'no-store' });
                const json = await res.json();

                if (!res.ok) {
                    throw new Error(json.error || 'Failed to load activity.');
                }

                setTransactions(Array.isArray(json.data) ? json.data : []);
                setTotal(json.pagination?.total ?? 0);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load activity.');
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [page, filter]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const filtered = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) return transactions;
        return transactions.filter((tx) => {
            return tx.reference.toLowerCase().includes(query)
                || (tx.groups?.name ?? '').toLowerCase().includes(query);
        });
    }, [transactions, search]);

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Page summary bar */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-brand-gray font-semibold">
                    {total > 0 ? `${total} payment${total === 1 ? '' : 's'} total` : 'No payments yet'}
                </p>
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5">
                    {(['all', 'contribution', 'payout'] as const).map((item) => (
                        <button
                            key={item}
                            onClick={() => setFilter(item)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${filter === item ? 'bg-white text-brand-navy shadow-xs' : 'text-brand-gray'}`}
                        >
                            {item === 'all' ? 'All' : item === 'contribution' ? 'Sent' : 'Received'}
                        </button>
                    ))}
                </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by group name or ref"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-xl border border-slate-100 bg-slate-100 h-16" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 p-3 text-sm font-semibold">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-brand-gray">No payments found.</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map((tx) => {
                            const isContribution = tx.type === 'contribution';
                            return (
                                <div key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isContribution ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                                        {isContribution ? <ArrowUpRight size={16} className="text-blue-600" /> : <ArrowDownLeft size={16} className="text-emerald-600" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-brand-navy truncate">{tx.groups?.name ?? 'Group'}</p>
                                        <p className="text-[10px] text-brand-gray">
                                            {new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })} · Ref: {tx.reference.slice(-8)}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-sm font-bold ${isContribution ? 'text-brand-navy' : 'text-emerald-600'}`}>
                                            {isContribution ? '-' : '+'}NGN {Number(tx.amount).toLocaleString('en-NG')}
                                        </p>
                                        <p className={`text-[10px] font-medium ${tx.status === 'success' ? 'text-emerald-600' : tx.status === 'pending' ? 'text-amber-600' : tx.status === 'abandoned' ? 'text-orange-600' : 'text-rose-600'}`}>
                                            {tx.status === 'success' ? 'Successful' : tx.status === 'pending' ? 'Confirming' : tx.status === 'abandoned' ? 'Expired' : 'Failed'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <p className="text-xs text-brand-gray">
                            Page {page} of {totalPages} &middot; {total} payment{total === 1 ? '' : 's'}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={13} /> Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
