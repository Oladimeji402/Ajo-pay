'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type PayoutRow = {
    id: string;
    status: string;
    amount: number;
    cycle_number: number;
    groups?: { id: string; name: string } | null;
    profiles?: { id: string; name: string; email: string; phone?: string | null } | null;
};

export default function AdminPayoutsPage() {
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState('');
    const [error, setError] = useState('');
    const [payouts, setPayouts] = useState<PayoutRow[]>([]);

    const loadPayouts = async () => {
        const res = await fetch('/api/admin/payouts', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load payouts.');
        setPayouts(Array.isArray(json.data) ? json.data : []);
    };

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');
            try {
                await loadPayouts();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load payouts.');
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, []);

    const markDone = async (payoutId: string) => {
        setSavingId(payoutId);
        setError('');

        try {
            const res = await fetch('/api/admin/payouts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payoutId, status: 'done' }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to mark payout as done.');
            await loadPayouts();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update payout.');
        } finally {
            setSavingId('');
        }
    };

    if (loading) return <div className="min-h-80 grid place-items-center"><Loader2 className="animate-spin" size={16} /></div>;

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-brand-navy">Admin Payouts</h1>
            {error && <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 p-3 text-sm">{error}</div>}
            <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {payouts.map((payout) => (
                        <div key={payout.id} className="p-4 flex items-center justify-between gap-3 text-sm">
                            <div>
                                <p className="font-semibold text-brand-navy">{payout.profiles?.name || payout.profiles?.email || 'Recipient'} · {payout.groups?.name || 'Group'}</p>
                                <p className="text-xs text-brand-gray">Cycle {payout.cycle_number} · {payout.status}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-brand-navy">NGN {Number(payout.amount).toLocaleString('en-NG')}</p>
                                <button disabled={savingId === payout.id || payout.status === 'done'} onClick={() => markDone(payout.id)} className="mt-1 px-3 py-1.5 rounded-lg bg-brand-navy text-white text-xs font-bold disabled:opacity-50">{payout.status === 'done' ? 'Done' : savingId === payout.id ? 'Saving...' : 'Mark Done'}</button>
                            </div>
                        </div>
                    ))}
                    {payouts.length === 0 && <p className="p-4 text-sm text-brand-gray">No payouts found.</p>}
                </div>
            </div>
        </div>
    );
}
