'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Target, Loader2, Calendar, Pause, PlayCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { useData } from '@/lib/hooks/useData';
import { clientCache } from '@/lib/client-cache';

type SavingsGoal = {
    id: string;
    name: string;
    target_amount: number;
    contribution_amount: number;
    total_saved: number;
    target_date: string;
    frequency: string;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    festive_periods?: { color: string } | null;
};

type Scheme = {
    id: string;
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    minimum_amount: number;
    status: 'active' | 'paused' | 'cancelled';
};

const PAYOUT_LABELS: Record<string, string> = {
    daily: 'Paid out end of month',
    weekly: 'Paid out end of quarter',
    monthly: 'Paid out end of year',
};

type NewScheme = {
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
};

type NewGoal = {
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    target_amount: string;
    contribution_amount: string;
    target_date: string;
};

type SavingsData = { goals: SavingsGoal[]; schemes: Scheme[]; gated: boolean };

async function fetchSavingsData(): Promise<SavingsData> {
    const [goalsRes, schemesRes] = await Promise.all([
        fetch('/api/savings/goals'),
        fetch('/api/savings/schemes'),
    ]);
    if (goalsRes.status === 403) return { goals: [], schemes: [], gated: true };
    const goalsJson = goalsRes.ok ? await goalsRes.json() : { data: [] };
    const schemesJson = schemesRes.ok ? await schemesRes.json() : { data: [] };
    return {
        goals: Array.isArray(goalsJson.data) ? goalsJson.data : [],
        schemes: Array.isArray(schemesJson.data) ? schemesJson.data : [],
        gated: false,
    };
}

export default function SavingsPage() {
    const { showToast } = useToast();

    const { data, loading, mutate } = useData<SavingsData>('savings-data', fetchSavingsData);
    const goals   = data?.goals   ?? [];
    const schemes = data?.schemes ?? [];
    const passbookGated = data?.gated ?? false;

    // Local optimistic state for schemes list (avoids full refetch on toggle/create)
    const [localSchemes, setLocalSchemes] = useState<Scheme[] | null>(null);
    const displaySchemes = localSchemes ?? schemes;

    const [showSchemeForm, setShowSchemeForm] = useState(false);
    const [showGoalForm, setShowGoalForm] = useState(false);
    const [newScheme, setNewScheme] = useState<NewScheme>({ name: '', frequency: 'daily' });
    const [newGoal, setNewGoal] = useState<NewGoal>({
        name: '',
        frequency: 'monthly',
        target_amount: '100000',
        contribution_amount: '5000',
        target_date: '',
    });
    const [creating, setCreating] = useState(false);
    const [creatingGoal, setCreatingGoal] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fmt = (v: number) => `NGN ${Number(v).toLocaleString('en-NG')}`;

    const handleCreateScheme = async () => {
        if (!newScheme.name.trim()) {
            notifyError(showToast, new Error('Name required'), 'Enter a name for this scheme.');
            return;
        }
        setCreating(true);
        try {
            const res = await fetch('/api/savings/schemes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newScheme.name.trim(), frequency: newScheme.frequency }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Could not create scheme.');
            notifySuccess(showToast, `"${json.data.name}" created.`);
            const next = [...displaySchemes, json.data];
            setLocalSchemes(next);
            // Also update the cache so Pay page gets the new scheme without refetching
            clientCache.set('savings-data', { goals, schemes: next, gated: passbookGated });
            setNewScheme({ name: '', frequency: 'daily' });
            setShowSchemeForm(false);
        } catch (err) {
            notifyError(showToast, err, 'Could not create scheme.');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateGoal = async () => {
        const targetAmount = Number(newGoal.target_amount);
        const contributionAmount = Number(newGoal.contribution_amount);
        if (!newGoal.name.trim()) return notifyError(showToast, new Error('Name required'), 'Enter a target name.');
        if (!newGoal.target_date) return notifyError(showToast, new Error('Date required'), 'Select a target date.');
        if (!Number.isFinite(targetAmount) || targetAmount <= 0) return notifyError(showToast, new Error('Amount invalid'), 'Enter a valid target amount.');
        if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) return notifyError(showToast, new Error('Amount invalid'), 'Enter a valid contribution amount.');

        setCreatingGoal(true);
        try {
            const today = new Date().toISOString().slice(0, 10);
            const res = await fetch('/api/savings/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    festive_period_id: null,
                    name: newGoal.name.trim(),
                    description: '',
                    target_amount: Math.round(targetAmount),
                    target_date: newGoal.target_date,
                    savings_start_date: today,
                    frequency: newGoal.frequency,
                    contribution_amount: Math.round(contributionAmount),
                    priority: 3,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Could not create target savings.');
            const nextGoals = [...goals, json.data];
            clientCache.set('savings-data', { goals: nextGoals, schemes: displaySchemes, gated: passbookGated });
            notifySuccess(showToast, `"${json.data.name}" added.`);
            setNewGoal({
                name: '',
                frequency: 'monthly',
                target_amount: '100000',
                contribution_amount: '5000',
                target_date: '',
            });
            setShowGoalForm(false);
        } catch (err) {
            notifyError(showToast, err, 'Could not create target savings.');
        } finally {
            setCreatingGoal(false);
        }
    };

    const handleToggleScheme = async (scheme: Scheme) => {
        const nextStatus: Scheme['status'] = scheme.status === 'active' ? 'paused' : 'active';
        setTogglingId(scheme.id);
        try {
            const res = await fetch(`/api/savings/schemes/${scheme.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Could not update scheme.');
            const next: Scheme[] = displaySchemes.map((s) =>
                s.id === scheme.id ? { ...s, status: nextStatus } : s,
            );
            setLocalSchemes(next);
            clientCache.set('savings-data', { goals, schemes: next, gated: passbookGated });
            notifySuccess(showToast, nextStatus === 'active' ? 'Scheme resumed.' : 'Scheme paused.');
        } catch (err) {
            notifyError(showToast, err, 'Could not update scheme.');
        } finally {
            setTogglingId(null);
        }
    };

    // Keep localSchemes in sync when remote data updates
    React.useEffect(() => {
        if (data) setLocalSchemes(null); // let useData-fresh data win after a revalidation
    }, [data]);

    void mutate;

    const rowsByFreq = useMemo(() => {
        const allRows = [
            ...goals.map((goal) => ({
                id: `goal-${goal.id}`,
                frequency: goal.frequency as 'daily' | 'weekly' | 'monthly',
                scheme: goal.name,
                type: 'Target',
                contribution: fmt(goal.contribution_amount),
                target: fmt(goal.target_amount),
                saved: fmt(goal.total_saved),
                payout: goal.target_date,
                status: goal.status,
            })),
            ...displaySchemes.map((scheme) => ({
                id: `scheme-${scheme.id}`,
                frequency: scheme.frequency,
                scheme: scheme.name,
                type: 'General',
                contribution: `Min ${fmt(scheme.minimum_amount)}`,
                target: '-',
                saved: '-',
                payout: PAYOUT_LABELS[scheme.frequency],
                status: scheme.status,
                schemeId: scheme.id,
            })),
        ];
        return {
            daily: allRows.filter((r) => r.frequency === 'daily'),
            weekly: allRows.filter((r) => r.frequency === 'weekly'),
            monthly: allRows.filter((r) => r.frequency === 'monthly'),
        };
    }, [goals, displaySchemes]);

    if (passbookGated) {
        return (
            <div className="max-w-md mx-auto mt-12 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
                    <BookOpen size={26} className="text-amber-700" />
                </div>
                <h2 className="text-lg font-bold text-brand-navy">Activate your Passbook first</h2>
                <p className="text-sm text-brand-gray">One-time NGN 500 fee to unlock savings goals.</p>
                <Link
                    href="/onboarding/activate-passbook"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-primary-hover transition-colors"
                >
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
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h1 className="text-base font-bold text-brand-navy flex items-center gap-2">
                        <BookOpen size={16} className="text-brand-primary" />
                        Savings Plans
                    </h1>
                    <p className="text-[11px] text-brand-gray">All your target and general plans in one frequency table view.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowGoalForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-3 py-2 text-xs font-bold text-white hover:bg-brand-primary-hover">
                        <Target size={12} /> Add Target
                    </button>
                    <button onClick={() => setShowSchemeForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                        <Calendar size={12} /> Add General
                    </button>
                </div>
            </div>

            {showGoalForm && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                    <p className="text-xs font-bold text-brand-navy">New Target Savings</p>
                    <div className="grid gap-2 md:grid-cols-3">
                        <input value={newGoal.name} onChange={(e) => setNewGoal((s) => ({ ...s, name: e.target.value }))} placeholder="Name" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                        <input type="number" value={newGoal.target_amount} onChange={(e) => setNewGoal((s) => ({ ...s, target_amount: e.target.value }))} placeholder="Target amount" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                        <input type="number" value={newGoal.contribution_amount} onChange={(e) => setNewGoal((s) => ({ ...s, contribution_amount: e.target.value }))} placeholder="Contribution amount" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                        <select value={newGoal.frequency} onChange={(e) => setNewGoal((s) => ({ ...s, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                        <input type="date" value={newGoal.target_date} onChange={(e) => setNewGoal((s) => ({ ...s, target_date: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreateGoal} disabled={creatingGoal} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                            {creatingGoal ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create Target
                        </button>
                        <button onClick={() => setShowGoalForm(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-brand-gray">Cancel</button>
                    </div>
                </div>
            )}

            {showSchemeForm && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 space-y-3">
                    <p className="text-xs font-bold text-emerald-900">New General Savings Scheme</p>
                    <div className="grid gap-2 md:grid-cols-2">
                        <input value={newScheme.name} onChange={(e) => setNewScheme((s) => ({ ...s, name: e.target.value }))} placeholder="Scheme name" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                        <select value={newScheme.frequency} onChange={(e) => setNewScheme((s) => ({ ...s, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreateScheme} disabled={creating} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                            {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create General
                        </button>
                        <button onClick={() => setShowSchemeForm(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-brand-gray">Cancel</button>
                    </div>
                </div>
            )}

            <section className="grid gap-3 md:grid-cols-3">
                <Link href="/savings/frequency/daily" className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-brand-navy">Daily</p>
                        <Calendar size={14} className="text-emerald-600" />
                    </div>
                    <p className="mt-1 text-xs text-brand-gray">Open daily plan list</p>
                    <p className="mt-2 text-xs font-semibold text-brand-navy">{rowsByFreq.daily.length} plan(s)</p>
                </Link>

                <Link href="/savings/frequency/weekly" className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-brand-navy">Weekly</p>
                        <Calendar size={14} className="text-indigo-600" />
                    </div>
                    <p className="mt-1 text-xs text-brand-gray">Open weekly plan list</p>
                    <p className="mt-2 text-xs font-semibold text-brand-navy">{rowsByFreq.weekly.length} plan(s)</p>
                </Link>

                <Link href="/savings/frequency/monthly" className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-brand-navy">Monthly</p>
                        <Calendar size={14} className="text-amber-600" />
                    </div>
                    <p className="mt-1 text-xs text-brand-gray">Open monthly plan list</p>
                    <p className="mt-2 text-xs font-semibold text-brand-navy">{rowsByFreq.monthly.length} plan(s)</p>
                </Link>
            </section>

            <p className="text-[11px] text-brand-gray">
                Click Daily/Weekly/Monthly to see a focused list, then click any plan name for full details.
            </p>
        </div>
    );
}
