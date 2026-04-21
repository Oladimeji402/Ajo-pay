'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, ChevronRight, Target, Loader2 } from 'lucide-react';

type SavingsGoal = {
    id: string;
    name: string;
    target_amount: number;
    total_saved: number;
    target_date: string;
    frequency: string;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    festive_periods?: { color: string } | null;
};

export default function SavingsPage() {
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [passbookGated, setPassbookGated] = useState(false);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            const res = await fetch('/api/savings/goals', { cache: 'no-store' });
            const json = await res.json();
            if (res.status === 403) { setPassbookGated(true); setLoading(false); return; }
            setGoals(Array.isArray(json.data) ? json.data : []);
            setLoading(false);
        };
        void run();
    }, []);

    const fmt = (v: number) => `NGN ${Number(v).toLocaleString('en-NG')}`;

    if (passbookGated) {
        return (
            <div className="max-w-md mx-auto mt-12 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
                    <BookOpen size={26} className="text-amber-700" />
                </div>
                <h2 className="text-lg font-bold text-brand-navy">Activate your Passbook first</h2>
                <p className="text-sm text-brand-gray">One-time NGN 500 fee to unlock savings goals.</p>
                <Link href="/onboarding/activate-passbook" className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-primary-hover transition-colors">
                    Activate Passbook
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-gray">
                <Loader2 size={16} className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-base font-bold text-brand-navy">Savings</h1>
                <Link href="/savings/new" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-3 py-2 text-xs font-bold text-white hover:bg-brand-primary-hover transition-colors">
                    <Plus size={13} /> New Goal
                </Link>
            </div>

            {goals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-8 text-center space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                        <Target size={20} className="text-brand-primary" />
                    </div>
                    <p className="font-bold text-brand-navy text-sm">No savings goals yet</p>
                    <p className="text-xs text-brand-gray">Save toward Detty December, Sallah, school fees — anything that matters.</p>
                    <Link href="/savings/new" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white hover:bg-brand-primary-hover transition-colors">
                        <Plus size={13} /> Create goal
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {goals.map(goal => {
                        const color = goal.festive_periods?.color ?? '#1D4ED8';
                        const progress = Math.min(100, Math.round((Number(goal.total_saved) / Number(goal.target_amount)) * 100));
                        return (
                            <Link
                                key={goal.id}
                                href={`/savings/${goal.id}`}
                                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-slate-300 transition-colors"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18` }}>
                                    <BookOpen size={16} style={{ color }} />
                                </div>

                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-brand-navy truncate">{goal.name}</p>
                                        <span className="shrink-0 text-[10px] text-brand-gray capitalize">{goal.frequency}</span>
                                    </div>
                                    <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: color }} />
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-brand-gray">
                                        <span>{fmt(goal.total_saved)} of {fmt(goal.target_amount)}</span>
                                        <span>{progress}%</span>
                                    </div>
                                </div>

                                <ChevronRight size={13} className="shrink-0 text-slate-300" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
