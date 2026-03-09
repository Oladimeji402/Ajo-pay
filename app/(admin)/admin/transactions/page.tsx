'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type TxRow = {
    id: string;
    type: string;
    status: string;
    amount: number;
    reference: string;
    provider_reference?: string | null;
    created_at: string;
    groups?: { id: string; name: string } | null;
    profiles?: { id: string; name: string; email: string } | null;
};

export default function AdminTransactionsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [transactions, setTransactions] = useState<TxRow[]>([]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch('/api/admin/transactions?page=1&pageSize=100', { cache: 'no-store' });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to load transactions.');
                setTransactions(Array.isArray(json.data) ? json.data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load transactions.');
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, []);

    if (loading) return <div className="min-h-80 grid place-items-center"><Loader2 className="animate-spin" size={16} /></div>;

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-brand-navy">Admin Transactions</h1>
            {error && <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 p-3 text-sm">{error}</div>}
            <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="p-4 flex items-center justify-between gap-3 text-sm">
                            <div>
                                <p className="font-semibold text-brand-navy">{tx.profiles?.name || tx.profiles?.email || 'User'} · {tx.groups?.name || 'Group'}</p>
                                <p className="text-xs text-brand-gray">{tx.reference} · {tx.provider_reference || '-'} · {new Date(tx.created_at).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-brand-navy">{tx.type === 'contribution' ? '-' : '+'}NGN {Number(tx.amount).toLocaleString('en-NG')}</p>
                                <p className="text-xs text-brand-gray capitalize">{tx.type} · {tx.status}</p>
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && <p className="p-4 text-sm text-brand-gray">No transactions yet.</p>}
                </div>
            </div>
        </div>
    );
}
