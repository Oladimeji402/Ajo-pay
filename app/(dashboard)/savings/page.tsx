'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Target, Loader2, Calendar, Pause, PlayCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
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

    // Festive periods state
    const [festivePeriods, setFestivePeriods] = useState<Array<{ id: string; name: string; emoji: string; color: string; target_date: string; suggested_frequency: string }>>([]);
    const [loadingFestive, setLoadingFestive] = useState(false);

    const [showSchemeForm, setShowSchemeForm] = useState(false);
    const [showGoalForm, setShowGoalForm] = useState(false);
    const [newScheme, setNewScheme] = useState<NewScheme>({ name: '', frequency: 'daily' });
    const [newGoal, setNewGoal] = useState<NewGoal>({
        name: '',
        frequency: 'monthly',
        target_amount: '',
        contribution_amount: '',
        target_date: '',
    });
    const [selectedFestivePeriod, setSelectedFestivePeriod] = useState<string>('');
    const [creating, setCreating] = useState(false);
    const [creatingGoal, setCreatingGoal] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fmt = (v: number) => `NGN ${Number(v).toLocaleString('en-NG')}`;

    // Load festive periods when form opens
    useEffect(() => {
        if (showGoalForm && festivePeriods.length === 0) {
            const loadFestive = async () => {
                setLoadingFestive(true);
                try {
                    const res = await fetch('/api/festive-periods');
                    const json = await res.json();
                    if (res.ok && Array.isArray(json.data)) {
                        setFestivePeriods(json.data);
                    }
                } catch (err) {
                    console.error('Failed to load festive periods:', err);
                } finally {
                    setLoadingFestive(false);
                }
            };
            void loadFestive();
        }
    }, [showGoalForm, festivePeriods.length]);

    // Auto-fill form when festive period is selected
    useEffect(() => {
        if (selectedFestivePeriod && festivePeriods.length > 0) {
            const period = festivePeriods.find(p => p.id === selectedFestivePeriod);
            if (period) {
                setNewGoal(prev => ({
                    ...prev,
                    name: period.name,
                    frequency: (period.suggested_frequency || 'monthly') as 'daily' | 'weekly' | 'monthly',
                    target_date: period.target_date,
                }));
            }
        }
    }, [selectedFestivePeriod, festivePeriods]);

    // Auto-calculate contribution amount based on frequency, target amount, and target date
    useEffect(() => {
        if (!newGoal.target_amount || !newGoal.target_date || !newGoal.frequency) {
            setNewGoal(prev => prev.contribution_amount ? { ...prev, contribution_amount: '' } : prev);
            return;
        }

        const targetAmount = Number(newGoal.target_amount);
        if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
            setNewGoal(prev => prev.contribution_amount ? { ...prev, contribution_amount: '' } : prev);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        const targetDate = new Date(newGoal.target_date);
        targetDate.setHours(0, 0, 0, 0); // Reset time to start of day
        
        const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 1) {
            // Date is in the past or today - clear calculation
            setNewGoal(prev => prev.contribution_amount ? { ...prev, contribution_amount: '' } : prev);
            return;
        }

        let periodsRemaining = 0;
        switch (newGoal.frequency) {
            case 'daily':
                periodsRemaining = daysRemaining;
                break;
            case 'weekly':
                periodsRemaining = Math.ceil(daysRemaining / 7);
                break;
            case 'monthly':
                periodsRemaining = Math.ceil(daysRemaining / 30);
                break;
        }

        if (periodsRemaining > 0) {
            const calculatedContribution = Math.ceil(targetAmount / periodsRemaining);
            setNewGoal(prev => ({
                ...prev,
                contribution_amount: calculatedContribution.toString(),
            }));
        }
    }, [newGoal.target_amount, newGoal.target_date, newGoal.frequency]);

    const handleCreateScheme = async () => {
        // Name is now optional - will be auto-generated based on frequency
        setCreating(true);
        try {
            const res = await fetch('/api/savings/schemes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    frequency: newScheme.frequency,
                    // Don't send name - let API auto-generate
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to create scheme.');
            notifySuccess(showToast, `${newScheme.frequency.charAt(0).toUpperCase() + newScheme.frequency.slice(1)} savings plan created!`);
            const next = [...displaySchemes, json.data];
            setLocalSchemes(next);
            clientCache.set('savings-data', { goals, schemes: next, gated: passbookGated });
            setNewScheme({ name: '', frequency: 'daily' });
            setShowSchemeForm(false);
        } catch (err) {
            notifyError(showToast, err, 'Unable to create savings plan.');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateGoal = async () => {
        const targetAmount = Number(newGoal.target_amount);
        const contributionAmount = Number(newGoal.contribution_amount) || targetAmount; // Use calculated or fall back to target amount
        if (!newGoal.name.trim()) return notifyError(showToast, new Error('Name required'), 'Enter a target name.');
        if (!newGoal.target_date) return notifyError(showToast, new Error('Date required'), 'Select a target date.');
        if (!Number.isFinite(targetAmount) || targetAmount <= 0) return notifyError(showToast, new Error('Amount invalid'), 'Enter a valid target amount.');

        setCreatingGoal(true);
        try {
            const today = new Date().toISOString().slice(0, 10);
            const res = await fetch('/api/savings/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    festive_period_id: selectedFestivePeriod || null,
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
                target_amount: '',
                contribution_amount: '',
                target_date: '',
            });
            setSelectedFestivePeriod('');
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
                    <button onClick={() => setShowGoalForm(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-3 py-2 text-xs font-bold text-white hover:bg-brand-primary-hover">
                        <Target size={12} /> Add Target
                    </button>
                    <button onClick={() => setShowSchemeForm(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                        <Calendar size={12} /> Add General
                    </button>
                </div>
            </div>

            {showGoalForm && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                    <div>
                        <p className="text-xs font-bold text-brand-navy">New Target Savings</p>
                        <p className="text-[10px] text-blue-700 mt-0.5">Save towards a specific goal or festive period</p>
                    </div>

                    {/* Festive Period Selector */}
                    <div>
                        <label className="text-xs font-semibold text-brand-navy mb-1.5 block">
                            Choose Festive Period (Optional)
                        </label>
                        <select 
                            value={selectedFestivePeriod} 
                            onChange={(e) => setSelectedFestivePeriod(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                            disabled={loadingFestive}
                        >
                            <option value="">Custom Target (Enter manually)</option>
                            {loadingFestive && <option>Loading festive periods...</option>}
                            {festivePeriods.map((period) => (
                                <option key={period.id} value={period.id}>
                                    {period.emoji} {period.name} - {new Date(period.target_date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </option>
                            ))}
                        </select>
                        {selectedFestivePeriod && (
                            <p className="text-[10px] text-blue-600 mt-1">
                                ℹ️ Name, date, and frequency will be auto-filled from the festive period
                            </p>
                        )}
                    </div>

                    <div className="grid gap-3">
                        <div className="grid gap-2 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-brand-navy mb-1.5 block">Target Name</label>
                                <input 
                                    value={newGoal.name} 
                                    onChange={(e) => setNewGoal((s) => ({ ...s, name: e.target.value }))} 
                                    placeholder="e.g., iPhone, School Fees, Christmas" 
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                    disabled={!!selectedFestivePeriod}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-brand-navy mb-1.5 block">Target Date</label>
                                <input 
                                    type="date" 
                                    value={newGoal.target_date} 
                                    onChange={(e) => setNewGoal((s) => ({ ...s, target_date: e.target.value }))} 
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                    disabled={!!selectedFestivePeriod}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-brand-navy mb-1.5 block">Target Amount (NGN)</label>
                                <input 
                                    type="number" 
                                    value={newGoal.target_amount} 
                                    onChange={(e) => setNewGoal((s) => ({ ...s, target_amount: e.target.value }))} 
                                    placeholder="e.g., 100000" 
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" 
                                    min="1000"
                                    step="1000"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-brand-navy mb-1.5 block">Savings Frequency</label>
                                <select 
                                    value={newGoal.frequency} 
                                    onChange={(e) => setNewGoal((s) => ({ ...s, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))} 
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                    disabled={!!selectedFestivePeriod}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>

                        {/* Auto-calculated contribution amount display */}
                        {newGoal.target_amount && newGoal.target_date && newGoal.contribution_amount && (
                            <div className="rounded-lg bg-white border border-blue-200 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-semibold text-brand-navy mb-1">💡 You need to save:</p>
                                        <p className="text-lg font-bold text-brand-primary">
                                            {fmt(Number(newGoal.contribution_amount))} / {newGoal.frequency}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-brand-gray mb-0.5">
                                            {(() => {
                                                if (!newGoal.target_date) return '';
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const targetDate = new Date(newGoal.target_date);
                                                targetDate.setHours(0, 0, 0, 0);
                                                const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                
                                                let periodsRemaining = 0;
                                                switch (newGoal.frequency) {
                                                    case 'daily':
                                                        periodsRemaining = daysRemaining;
                                                        return `${periodsRemaining} days`;
                                                    case 'weekly':
                                                        periodsRemaining = Math.ceil(daysRemaining / 7);
                                                        return `${periodsRemaining} weeks`;
                                                    case 'monthly':
                                                        periodsRemaining = Math.ceil(daysRemaining / 30);
                                                        return `${periodsRemaining} months`;
                                                }
                                            })()}
                                        </p>
                                        <p className="text-[10px] text-blue-600 font-medium">
                                            to reach target
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Warning for past dates */}
                        {newGoal.target_amount && newGoal.target_date && !newGoal.contribution_amount && (
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                                <p className="text-xs text-amber-800">
                                    ⚠️ Please select a future date to calculate your savings plan
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={handleCreateGoal} 
                            disabled={creatingGoal || !newGoal.name.trim() || !newGoal.target_amount || !newGoal.target_date} 
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-60 hover:bg-brand-primary-hover transition-colors"
                        >
                            {creatingGoal ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create Target
                        </button>
                        <button onClick={() => {
                            setShowGoalForm(false);
                            setSelectedFestivePeriod('');
                            setNewGoal({
                                name: '',
                                frequency: 'monthly',
                                target_amount: '',
                                contribution_amount: '',
                                target_date: '',
                            });
                        }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-brand-gray hover:bg-slate-50 transition-colors">Cancel</button>
                    </div>
                </div>
            )}

            {showSchemeForm && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 space-y-3">
                    <div>
                        <p className="text-xs font-bold text-emerald-900">New General Savings Plan</p>
                        <p className="text-[10px] text-emerald-700 mt-0.5">Choose how often you want to save. The plan name will be auto-generated.</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-emerald-900 mb-1.5 block">Savings Frequency</label>
                        <select 
                            value={newScheme.frequency} 
                            onChange={(e) => setNewScheme((s) => ({ ...s, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))} 
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="daily">Daily - Paid out end of month</option>
                            <option value="weekly">Weekly - Paid out end of quarter</option>
                            <option value="monthly">Monthly - Paid out end of year</option>
                        </select>
                    </div>
                    <div className="rounded-lg bg-white border border-emerald-200 p-3">
                        <p className="text-xs font-semibold text-emerald-900 mb-1">Plan will be created as:</p>
                        <p className="text-sm font-bold text-brand-navy">
                            General {newScheme.frequency.charAt(0).toUpperCase() + newScheme.frequency.slice(1)} Savings
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreateScheme} disabled={creating} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60 hover:bg-emerald-700 transition-colors">
                            {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create Plan
                        </button>
                        <button onClick={() => setShowSchemeForm(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-brand-gray hover:bg-slate-50 transition-colors">Cancel</button>
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

            {/* Add Target Modal */}
            <Modal
                isOpen={showGoalForm}
                onClose={() => {
                    setShowGoalForm(false);
                    setSelectedFestivePeriod('');
                    setNewGoal({
                        name: '',
                        frequency: 'monthly',
                        target_amount: '',
                        contribution_amount: '',
                        target_date: '',
                    });
                }}
                title="New Target Savings"
                subtitle="Save towards a specific goal or festive period"
                size="md"
            >
                <div className="space-y-4">
                    {/* Festive Period Selector */}
                    <div>
                        <label className="text-xs font-semibold text-brand-navy mb-1.5 block">
                            Choose Festive Period (Optional)
                        </label>
                        <select 
                            value={selectedFestivePeriod} 
                            onChange={(e) => setSelectedFestivePeriod(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                            disabled={loadingFestive}
                        >
                            <option value="">Custom Target (Enter manually)</option>
                            {loadingFestive && <option>Loading festive periods...</option>}
                            {festivePeriods.map((period) => (
                                <option key={period.id} value={period.id}>
                                    {period.emoji} {period.name} - {new Date(period.target_date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </option>
                            ))}
                        </select>
                        {selectedFestivePeriod && (
                            <p className="text-[10px] text-blue-600 mt-1">
                                ℹ️ Name, date, and frequency will be auto-filled from the festive period
                            </p>
                        )}
                    </div>

                    <div className="grid gap-3">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-brand-navy mb-1.5 block">Target Name</label>
                                <input 
                                    value={newGoal.name} 
                                    onChange={(e) => setNewGoal((s) => ({ ...s, name: e.target.value }))} 
                                    placeholder="e.g., iPhone, School Fees, Christmas" 
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    disabled={!!selectedFestivePeriod}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-brand-navy mb-1.5 block">Target Date</label>
                                <input 
                                    type="date" 
                                    value={newGoal.target_date} 
                                    onChange={(e) => setNewGoal((s) => ({ ...s, target_date: e.target.value }))} 
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    disabled={!!selectedFestivePeriod}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-brand-navy mb-1.5 block">Target Amount (NGN)</label>
                                <input 
                                    type="number" 
                                    value={newGoal.target_amount} 
                                    onChange={(e) => setNewGoal((s) => ({ ...s, target_amount: e.target.value }))} 
                                    placeholder="e.g., 100000" 
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                                    min="1000"
                                    step="1000"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-brand-navy mb-1.5 block">Savings Frequency</label>
                                <select 
                                    value={newGoal.frequency} 
                                    onChange={(e) => setNewGoal((s) => ({ ...s, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))} 
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    disabled={!!selectedFestivePeriod}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>

                        {/* Auto-calculated contribution amount display */}
                        {newGoal.target_amount && newGoal.target_date && newGoal.contribution_amount && (
                            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold text-brand-navy mb-1">💡 You need to save:</p>
                                        <p className="text-xl font-bold text-brand-primary">
                                            {fmt(Number(newGoal.contribution_amount))} / {newGoal.frequency}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-brand-gray mb-0.5">
                                            {(() => {
                                                if (!newGoal.target_date) return '';
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const targetDate = new Date(newGoal.target_date);
                                                targetDate.setHours(0, 0, 0, 0);
                                                const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                
                                                let periodsRemaining = 0;
                                                switch (newGoal.frequency) {
                                                    case 'daily':
                                                        periodsRemaining = daysRemaining;
                                                        return `${periodsRemaining} days`;
                                                    case 'weekly':
                                                        periodsRemaining = Math.ceil(daysRemaining / 7);
                                                        return `${periodsRemaining} weeks`;
                                                    case 'monthly':
                                                        periodsRemaining = Math.ceil(daysRemaining / 30);
                                                        return `${periodsRemaining} months`;
                                                }
                                            })()}
                                        </p>
                                        <p className="text-xs text-blue-600 font-medium">
                                            to reach target
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Warning for past dates */}
                        {newGoal.target_amount && newGoal.target_date && !newGoal.contribution_amount && (
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                                <p className="text-xs text-amber-800">
                                    ⚠️ Please select a future date to calculate your savings plan
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button 
                            onClick={handleCreateGoal} 
                            disabled={creatingGoal || !newGoal.name.trim() || !newGoal.target_amount || !newGoal.target_date} 
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 hover:bg-brand-primary-hover transition-colors"
                        >
                            {creatingGoal ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Target
                        </button>
                        <button 
                            onClick={() => {
                                setShowGoalForm(false);
                                setSelectedFestivePeriod('');
                                setNewGoal({
                                    name: '',
                                    frequency: 'monthly',
                                    target_amount: '',
                                    contribution_amount: '',
                                    target_date: '',
                                });
                            }} 
                            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-gray hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add General Savings Modal */}
            <Modal
                isOpen={showSchemeForm}
                onClose={() => setShowSchemeForm(false)}
                title="New General Savings Plan"
                subtitle="Choose how often you want to save. The plan name will be auto-generated."
                size="sm"
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-brand-navy mb-1.5 block">Savings Frequency</label>
                        <select 
                            value={newScheme.frequency} 
                            onChange={(e) => setNewScheme((s) => ({ ...s, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))} 
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="daily">Daily - Paid out end of month</option>
                            <option value="weekly">Weekly - Paid out end of quarter</option>
                            <option value="monthly">Monthly - Paid out end of year</option>
                        </select>
                    </div>
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                        <p className="text-xs font-semibold text-emerald-900 mb-1.5">Plan will be created as:</p>
                        <p className="text-base font-bold text-brand-navy">
                            General {newScheme.frequency.charAt(0).toUpperCase() + newScheme.frequency.slice(1)} Savings
                        </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button 
                            onClick={handleCreateScheme} 
                            disabled={creating} 
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 hover:bg-emerald-700 transition-colors"
                        >
                            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Plan
                        </button>
                        <button 
                            onClick={() => setShowSchemeForm(false)} 
                            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-gray hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
