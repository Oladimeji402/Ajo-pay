'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError } from '@/lib/toast';
import { PassbookTable } from '@/components/passbook/PassbookTable';
import type { PassbookContribution } from '@/components/passbook/PassbookTable';

type SavingsGoal = {
    id: string;
    name: string;
    target_amount: number;
    total_saved: number;
    target_date: string;
    savings_start_date: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    contribution_amount: number;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    festive_periods?: { color: string } | null;
    individual_savings_contributions: PassbookContribution[];
};

function SavingsGoalDetail() {
    const { id } = useParams<{ id: string }>();
    const { showToast } = useToast();

    const [goal, setGoal] = useState<SavingsGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);

    const loadGoal = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/savings/goals/${id}`, { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setGoal(json.data as SavingsGoal);
        } catch (err) {
            notifyError(showToast, err, 'Could not load savings goal.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadGoal(); }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-gray">
                <Loader2 size={16} className="animate-spin" />
            </div>
        );
    }

    if (!goal) {
        return (
            <div className="py-16 text-center text-sm text-brand-gray">
                Not found. <Link href="/savings" className="text-brand-primary font-semibold">Go back</Link>
            </div>
        );
    }

    const color = goal.festive_periods?.color ?? '#1D4ED8';
    const progress = Math.min(100, Math.round((Number(goal.total_saved) / Number(goal.target_amount)) * 100));
    const fmt = (v: number) => `NGN ${Number(v).toLocaleString('en-NG')}`;

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <Link href="/savings" className="inline-flex items-center gap-1.5 text-xs text-brand-gray hover:text-brand-navy">
                <ArrowLeft size={13} /> Back
            </Link>

            {/* Payment result banner */}
            {paymentStatus === 'success' && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={15} className="shrink-0" />
                    Wallet payment successful — your passbook has been updated.
                </div>
            )}
            {paymentStatus === 'failed' && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    Could not complete wallet payment.
                </div>
            )}

            {/* Summary card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18` }}>
                            <BookOpen size={16} style={{ color }} />
                        </div>
                        <p className="text-sm font-bold text-brand-navy truncate">{goal.name}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-brand-gray capitalize">{goal.frequency}</span>
                </div>

                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-brand-navy">{fmt(goal.total_saved)}</span>
                        <span className="text-brand-gray">{fmt(goal.target_amount)} · {progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: color }} />
                    </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-brand-gray">
                    <span>Due {new Date(goal.target_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>{fmt(goal.contribution_amount)} / {goal.frequency === 'daily' ? 'day' : goal.frequency === 'weekly' ? 'week' : 'month'}</span>
                </div>
            </div>

            {/* Passbook */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <p className="text-xs font-bold text-brand-gray uppercase tracking-wider">Passbook</p>
                <PassbookTable
                    startDate={goal.savings_start_date}
                    endDate={goal.target_date}
                    frequency={goal.frequency}
                    contributions={goal.individual_savings_contributions}
                    contributionAmount={goal.contribution_amount}
                    onPay={async slot => {
                        try {
                            const res = await fetch('/api/payments/individual-savings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ goalId: goal.id, periodIndex: slot.periodIndex }),
                            });
                            const json = await res.json();
                            if (!res.ok) throw new Error(json.error);
                            setPaymentStatus('success');
                            await loadGoal();
                        } catch (err) {
                            setPaymentStatus('failed');
                            notifyError(showToast, err, 'Could not start payment.');
                        }
                    }}
                />
            </div>
        </div>
    );
}

export default function SavingsGoalDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-gray">
                <Loader2 size={16} className="animate-spin" />
            </div>
        }>
            <SavingsGoalDetail />
        </Suspense>
    );
}
