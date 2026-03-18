'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Filter, Search, Waves } from 'lucide-react';

const PAGE_SIZE = 20;

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
        <div className="max-w-5xl mx-auto space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-brand-navy via-[#142B5E] to-brand-emerald p-6 text-white">
                <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-8 -bottom-12 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl" />
                <div className="relative flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 font-semibold">Transaction Stream</p>
                        <h1 className="text-2xl font-semibold mt-1 inline-flex items-center gap-2"><Activity size={20} /> Activity Timeline</h1>
                        <p className="text-sm text-white/80 mt-2">Review contribution and payout movement in one continuous feed.</p>
                    </div>
                    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/70 mb-1">Total Records</p>
                        <p className="font-semibold text-lg">{total}</p>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-1 rounded-xl bg-slate-100 border border-slate-200 p-1 w-fit">
                        <p className="sr-only">Filter activity type</p>
                        <span className="inline-flex items-center px-2 text-slate-500"><Filter size={13} /></span>
                        {(['all', 'contribution', 'payout'] as const).map((item) => (
                            <button
                                key={item}
                                onClick={() => setFilter(item)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${filter === item ? 'bg-white text-brand-navy shadow-xs' : 'text-brand-gray'}`}
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
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-2xl border border-slate-100 bg-slate-100 h-[4.5rem]" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 p-3 text-sm font-semibold">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-brand-gray">No transactions found.</div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((tx) => {
                            const isContribution = tx.type === 'contribution';
                            return (
                                <div key={tx.id} className="rounded-2xl border border-slate-200 bg-linear-to-r from-white to-slate-50/70 p-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`h-10 w-10 rounded-xl grid place-items-center ${isContribution ? 'bg-brand-primary/10 text-brand-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {isContribution ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-brand-navy truncate">{tx.groups?.name ?? 'Group'}</p>
                                            <p className="text-[11px] text-brand-gray truncate">{new Date(tx.created_at).toLocaleString()} · {tx.reference}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-sm font-semibold ${isContribution ? 'text-brand-navy' : 'text-emerald-700'}`}>
                                            {isContribution ? '-' : '+'}NGN {Number(tx.amount).toLocaleString('en-NG')}
                                        </p>
                                        <p className="text-[11px] text-brand-gray capitalize inline-flex items-center gap-1 justify-end">
                                            <Waves size={11} /> {tx.status}
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
                            Page {page} of {totalPages} &middot; {total} records
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
