'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Plus, Trash2, Loader2, CreditCard, Users, BookOpen, CheckCircle2, ArrowRight, ShieldCheck, XCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess, notifyWarning } from '@/lib/toast';

type GroupOption = {
    id: string;
    name: string;
    contribution_amount: number;
    current_cycle: number;
};

type GoalOption = {
    id: string;
    name: string;
    contribution_amount: number;
    frequency: string;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    festive_periods?: { name: string; color: string } | null;
};

type AllocationItem = {
    key: string;
    type: 'group' | 'goal';
    id: string;
    label: string;
    amount: number;
    color?: string;
};

function PayPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const prefillGoalId = searchParams.get('goalId');
    const incomingRef = searchParams.get('ref');

    const { showToast } = useToast();
    const [groups, setGroups] = useState<GroupOption[]>([]);
    const [goals, setGoals] = useState<GoalOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [passbookGated, setPassbookGated] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'verifying' | 'success' | 'partial' | 'failed' | null>(null);
    const verifiedRef = useRef(false);

    const [allocations, setAllocations] = useState<AllocationItem[]>([]);
    const [selectedType, setSelectedType] = useState<'group' | 'goal'>('group');
    const [selectedId, setSelectedId] = useState('');
    const [customAmount, setCustomAmount] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [groupsRes, goalsRes] = await Promise.all([
                    fetch('/api/groups', { cache: 'no-store' }),
                    fetch('/api/savings/goals', { cache: 'no-store' }),
                ]);

                if (goalsRes.status === 403) {
                    setPassbookGated(true);
                }

                const groupsJson = await groupsRes.json();
                const goalsJson = goalsRes.ok ? await goalsRes.json() : { data: [] };

                setGroups(Array.isArray(groupsJson.data) ? groupsJson.data : []);
                setGoals(Array.isArray(goalsJson.data) ? goalsJson.data : []);

                // Pre-fill from URL
                if (prefillGoalId) {
                    const goal = (goalsJson.data as GoalOption[]).find(g => g.id === prefillGoalId);
                    if (goal) {
                        setSelectedType('goal');
                        setSelectedId(goal.id);
                        setCustomAmount(String(goal.contribution_amount));
                    }
                }
            } catch (err) {
                notifyError(showToast, err, 'Could not load savings options.');
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    // Auto-verify bulk payment callback
    useEffect(() => {
        if (!incomingRef || verifiedRef.current) return;
        verifiedRef.current = true;

        const verify = async () => {
            setPaymentStatus('verifying');
            try {
                const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(incomingRef)}`);
                const json = await res.json();
                if (res.ok && json.data?.status === 'success') {
                    if (json.data?.bulk?.partial) {
                        setPaymentStatus('partial');
                    } else {
                        setPaymentStatus('success');
                    }
                    router.replace('/pay');
                } else {
                    setPaymentStatus('failed');
                }
            } catch {
                setPaymentStatus('failed');
            }
        };
        void verify();
    }, []);

    const getDefaultAmount = () => {
        if (selectedType === 'group') {
            return groups.find(g => g.id === selectedId)?.contribution_amount ?? 0;
        }
        return goals.find(g => g.id === selectedId)?.contribution_amount ?? 0;
    };

    const handleAdd = () => {
        if (!selectedId) { notifyWarning(showToast, 'Please select a savings target first.'); return; }
        const amount = Number(customAmount) || getDefaultAmount();
        if (!amount) { notifyWarning(showToast, 'Please enter an amount.'); return; }

        const alreadyAdded = allocations.some(a => a.id === selectedId);
        if (alreadyAdded) { notifyWarning(showToast, 'Already added. Remove it first to change the amount.'); return; }

        const key = `${selectedType}::${selectedId}`;

        if (selectedType === 'group') {
            const group = groups.find(g => g.id === selectedId);
            if (!group) return;
            setAllocations(a => [...a, { key, type: 'group', id: group.id, label: `${group.name} (Round ${group.current_cycle})`, amount }]);
        } else {
            const goal = goals.find(g => g.id === selectedId);
            if (!goal) return;
            setAllocations(a => [...a, { key, type: 'goal', id: goal.id, label: goal.name, amount, color: goal.festive_periods?.color }]);
        }

        setSelectedId('');
        setCustomAmount('');
    };

    const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);

    const handlePay = async () => {
        if (allocations.length === 0) {
            notifyWarning(showToast, 'Add at least one savings target to pay.');
            return;
        }
        setPaying(true);
        try {
            const singleAlloc = allocations.length === 1 ? allocations[0]! : null;

            // ── Single group payment ──────────────────────────────────────────
            if (singleAlloc?.type === 'group') {
                const group = groups.find(g => g.id === singleAlloc.id);
                if (!group) throw new Error('Group not found.');
                const res = await fetch('/api/payments/initialize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupId: group.id, cycleNumber: group.current_cycle, amount: singleAlloc.amount }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error);
                window.location.href = json.data.authorizationUrl;
                return;
            }

            // ── Single individual savings goal payment ────────────────────────
            if (singleAlloc?.type === 'goal') {
                const res = await fetch('/api/payments/individual-savings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ goalId: singleAlloc.id }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error);
                window.location.href = json.data.authorizationUrl;
                return;
            }

            // ── Bulk pay (multiple targets) ───────────────────────────────────
            const res = await fetch('/api/payments/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    allocations: allocations.map(a => ({
                        targetType: a.type === 'group' ? 'group' : 'individual_goal',
                        targetId: a.id,
                        amount: a.amount,
                    })),
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            notifySuccess(showToast, 'Payment initiated. Redirecting...');
            window.location.href = json.data.authorizationUrl;
        } catch (err) {
            notifyError(showToast, err, 'Could not initiate payment.');
        } finally {
            setPaying(false);
        }
    };

    const formatCurrency = (v: number) => `NGN ${Number(v).toLocaleString('en-NG')}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-gray">
                <Loader2 size={16} className="animate-spin" /> Loading your savings options...
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto space-y-5">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy">
                <ArrowLeft size={14} /> Back
            </Link>

            {paymentStatus === 'verifying' && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    <Loader2 size={15} className="animate-spin shrink-0" />
                    Verifying your payment...
                </div>
            )}
            {paymentStatus === 'success' && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={15} className="shrink-0" />
                    Payment successful — your savings have been updated.
                </div>
            )}
            {paymentStatus === 'partial' && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <CheckCircle2 size={15} className="shrink-0 text-amber-600" />
                    Payment received. Some targets may not have credited — open each savings goal and check the passbook, or contact support if money is missing.
                </div>
            )}
            {paymentStatus === 'failed' && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <XCircle size={15} className="shrink-0" />
                    Could not verify payment. If you were charged, it will reflect shortly.
                </div>
            )}

            <div>
                <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2">
                    <CreditCard size={20} className="text-brand-primary" />
                    Make Payment
                </h1>
                <p className="text-xs text-brand-gray mt-0.5">Pay into one or multiple savings in a single transaction.</p>
            </div>

            {/* Passbook gate notice */}
            {passbookGated && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <BookOpen size={14} className="shrink-0 mt-0.5" />
                    <div>
                        Activate your passbook to also pay into individual savings goals.{' '}
                        <Link href="/onboarding/activate-passbook" className="font-bold underline">Activate now →</Link>
                    </div>
                </div>
            )}

            {/* Step 1: Add targets */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <h2 className="text-sm font-bold text-brand-navy">Step 1 — Select savings targets</h2>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSelectedType('group')}
                        className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-colors ${selectedType === 'group' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Users size={12} className="inline mr-1" /> Groups
                    </button>
                    {!passbookGated && (
                        <button
                            onClick={() => setSelectedType('goal')}
                            className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-colors ${selectedType === 'goal' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        >
                            <BookOpen size={12} className="inline mr-1" /> Savings Goals
                        </button>
                    )}
                </div>

                <div className="space-y-2">
                    <select
                        value={selectedId}
                        onChange={e => {
                            setSelectedId(e.target.value);
                            if (selectedType === 'group') {
                                const g = groups.find(g => g.id === e.target.value);
                                if (g) setCustomAmount(String(g.contribution_amount));
                            } else {
                                const g = goals.find(g => g.id === e.target.value);
                                if (g) setCustomAmount(String(g.contribution_amount));
                            }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                    >
                        <option value="">— Choose {selectedType === 'group' ? 'a group' : 'a savings goal'} —</option>
                        {selectedType === 'group'
                            ? groups.map(g => (
                                <option key={g.id} value={g.id}>
                                    {g.name} · Round {g.current_cycle} · NGN {Number(g.contribution_amount).toLocaleString('en-NG')}
                                </option>
                            ))
                            : goals.filter(g => g.status === 'active').map(g => (
                                <option key={g.id} value={g.id}>
                                    {g.name} · {g.frequency} · NGN {Number(g.contribution_amount).toLocaleString('en-NG')}
                                </option>
                            ))
                        }
                    </select>

                    <div className="flex gap-2">
                        <input
                            type="number"
                            min={1}
                            value={customAmount}
                            onChange={e => setCustomAmount(e.target.value)}
                            placeholder="Amount (NGN)"
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                        />
                        <button
                            onClick={handleAdd}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-primary-hover transition-colors"
                        >
                            <Plus size={13} /> Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Step 2: Review */}
            {allocations.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                    <h2 className="text-sm font-bold text-brand-navy">Step 2 — Review &amp; pay</h2>

                    <div className="divide-y divide-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                        {allocations.map(a => (
                            <div key={a.key} className="flex items-center gap-3 px-3 py-3 bg-white hover:bg-slate-50">
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: a.type === 'goal' ? `${a.color ?? '#1D4ED8'}20` : '#EFF6FF' }}
                                >
                                    {a.type === 'group' ? <Users size={14} className="text-brand-primary" /> : <BookOpen size={14} style={{ color: a.color ?? '#1D4ED8' }} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-brand-navy truncate">{a.label}</p>
                                    <p className="text-[10px] text-brand-gray capitalize">{a.type === 'group' ? 'Group contribution' : 'Individual savings'}</p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                    <p className="text-sm font-bold text-brand-navy">{formatCurrency(a.amount)}</p>
                                    <button onClick={() => setAllocations(al => al.filter(x => x.key !== a.key))} className="text-slate-300 hover:text-red-400 transition-colors">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                        <span className="text-sm font-bold text-brand-navy">Total</span>
                        <span className="text-lg font-bold text-brand-navy">{formatCurrency(totalAmount)}</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] text-blue-700">
                        <ShieldCheck size={12} className="shrink-0" />
                        Payments processed securely via Paystack. Each target will be credited on confirmation.
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={paying}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
                    >
                        {paying ? (
                            <><Loader2 size={15} className="animate-spin" /> Processing...</>
                        ) : (
                            <>Pay {formatCurrency(totalAmount)} <ArrowRight size={15} /></>
                        )}
                    </button>
                </div>
            )}

            {/* Empty state */}
            {allocations.length === 0 && !loading && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center space-y-2">
                    <CheckCircle2 size={20} className="mx-auto text-slate-300" />
                    <p className="text-sm text-brand-gray">Add savings targets above to build your payment.</p>
                </div>
            )}
        </div>
    );
}

export default function PayPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-gray">
                <Loader2 size={16} className="animate-spin" />
            </div>
        }>
            <PayPageContent />
        </Suspense>
    );
}
