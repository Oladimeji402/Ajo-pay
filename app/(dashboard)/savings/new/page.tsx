'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CalendarDays, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { getTodayDateInputValue } from '@/lib/ajo-schedule';

type FestivePeriod = {
    id: string;
    name: string;
    emoji: string;
    color: string;
    category: string;
    target_date: string;
    savings_start_date: string;
    savings_end_date: string;
    suggested_frequency: 'daily' | 'weekly' | 'monthly';
};

const categoryBadge: Record<string, string> = {
    religious: 'bg-amber-50 text-amber-700',
    national: 'bg-blue-50 text-blue-700',
    cultural: 'bg-emerald-50 text-emerald-700',
    personal: 'bg-slate-100 text-slate-600',
};

export default function NewSavingsGoalPage() {
    const router = useRouter();
    const { showToast } = useToast();

    const [periods, setPeriods] = useState<FestivePeriod[]>([]);
    const [loadingPeriods, setLoadingPeriods] = useState(true);
    const [saving, setSaving] = useState(false);

    const [selectedPeriod, setSelectedPeriod] = useState<FestivePeriod | null>(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        target_amount: '',
        contribution_amount: '',
        target_date: getTodayDateInputValue(),
        savings_start_date: getTodayDateInputValue(),
        frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
        priority: 3,
        festive_period_id: null as string | null,
    });

    useEffect(() => {
        const load = async () => {
            setLoadingPeriods(true);
            try {
                const res = await fetch('/api/festive-periods', { cache: 'no-store' });
                const json = await res.json();
                setPeriods(Array.isArray(json.data) ? json.data : []);
            } catch {
                setPeriods([]);
            } finally {
                setLoadingPeriods(false);
            }
        };
        void load();
    }, []);

    const handleSelectPeriod = (period: FestivePeriod) => {
        setSelectedPeriod(period);
        setForm(f => ({
            ...f,
            name: period.name,
            target_date: period.target_date,
            savings_start_date: period.savings_start_date,
            frequency: period.suggested_frequency,
            festive_period_id: period.id,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.target_amount || !form.contribution_amount) {
            notifyError(showToast, new Error('Missing fields'), 'Please fill in all required fields.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/savings/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    target_amount: Number(form.target_amount),
                    contribution_amount: Number(form.contribution_amount),
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            notifySuccess(showToast, 'Savings goal created!');
            router.push(`/savings/${json.data.id}`);
        } catch (err) {
            notifyError(showToast, err, 'Could not create goal.');
        } finally {
            setSaving(false);
        }
    };

    // Suggest contribution amount based on target and date range
    const suggestAmount = () => {
        const target = Number(form.target_amount);
        const start = new Date(form.savings_start_date);
        const end = new Date(form.target_date);
        if (!target || isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return;

        const diffMs = end.getTime() - start.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        let periods = 0;
        if (form.frequency === 'daily') periods = Math.ceil(diffDays);
        else if (form.frequency === 'weekly') periods = Math.ceil(diffDays / 7);
        else periods = Math.ceil(diffDays / 30);

        if (periods > 0) {
            setForm(f => ({ ...f, contribution_amount: String(Math.ceil(target / periods)) }));
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Link href="/savings" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy">
                <ArrowLeft size={14} /> Back to Savings
            </Link>

            <div>
                <h1 className="text-xl font-bold text-brand-navy">New Savings Goal</h1>
                <p className="text-xs text-brand-gray mt-0.5">Choose a festive period or create a custom goal.</p>
            </div>

            {/* Step 1: Choose festive period */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="flex items-center gap-2">
                    <CalendarDays size={15} className="text-brand-primary" />
                    <h2 className="text-sm font-bold text-brand-navy">Step 1 — Pick a festive occasion (optional)</h2>
                </div>
                <p className="text-xs text-brand-gray">We will pre-fill the dates and frequency for you. You can also skip and enter manually below.</p>

                {loadingPeriods ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-brand-gray">
                        <Loader2 size={14} className="animate-spin" /> Loading occasions...
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {periods.map(period => (
                            <button
                                key={period.id}
                                type="button"
                                onClick={() => handleSelectPeriod(period)}
                                className={`rounded-xl border p-3 text-left transition-all ${selectedPeriod?.id === period.id ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <p className="text-xs font-bold text-brand-navy truncate">{period.name}</p>
                                <p className="text-[10px] text-brand-gray mt-0.5">{period.target_date}</p>
                                <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${categoryBadge[period.category] ?? ''}`}>
                                    {period.category}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Step 2: Goal details */}
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <BookOpen size={15} className="text-brand-primary" />
                    <h2 className="text-sm font-bold text-brand-navy">Step 2 — Goal details</h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-brand-gray mb-1">Goal name <span className="text-rose-500">*</span></label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. Detty December fund, Sallah savings"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">Target amount (NGN) <span className="text-rose-500">*</span></label>
                        <input
                            type="number"
                            min={1}
                            value={form.target_amount}
                            onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
                            onBlur={suggestAmount}
                            placeholder="e.g. 150000"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">Frequency <span className="text-rose-500">*</span></label>
                        <select
                            value={form.frequency}
                            onChange={e => setForm(f => ({ ...f, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">Start saving from</label>
                        <input
                            type="date"
                            value={form.savings_start_date}
                            onChange={e => setForm(f => ({ ...f, savings_start_date: e.target.value }))}
                            onBlur={suggestAmount}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">Target date</label>
                        <input
                            type="date"
                            value={form.target_date}
                            onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
                            onBlur={suggestAmount}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">
                            Amount per {form.frequency === 'daily' ? 'day' : form.frequency === 'weekly' ? 'week' : 'month'} (NGN) <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={form.contribution_amount}
                            onChange={e => setForm(f => ({ ...f, contribution_amount: e.target.value }))}
                            placeholder="Auto-suggested after you set target"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">Priority (1 = most urgent)</label>
                        <select
                            value={form.priority}
                            onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                        >
                            {[1, 2, 3, 4, 5].map(p => (
                                <option key={p} value={p}>
                                    {p} — {p === 1 ? 'Highest' : p === 2 ? 'High' : p === 3 ? 'Medium' : p === 4 ? 'Low' : 'Lowest'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-brand-gray mb-1">Notes (optional)</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={2}
                            placeholder="What are you saving for?"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
                >
                    {saving ? <><Loader2 size={15} className="animate-spin" /> Creating goal...</> : 'Create Savings Goal'}
                </button>
            </form>
        </div>
    );
}
