'use client';

import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useData } from '@/lib/hooks/useData';
import {
    ArrowLeft, Plus, Trash2, Loader2, CreditCard,
    CheckCircle2, ArrowRight, ShieldCheck, Search, ChevronDown, Target, Calendar,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess, notifyWarning } from '@/lib/toast';

// ── Types ─────────────────────────────────────────────────────────────────────

type SavingsOption = {
    id: string;
    /** Composite key: "goal::<uuid>" | "scheme::<uuid>" */
    key: string;
    type: 'goal' | 'scheme';
    name: string;
    subtitle: string;
    defaultAmount: number;
    color?: string;
    frequency?: string;
};

type AllocationItem = {
    key: string;
    type: 'goal' | 'scheme';
    id: string;
    label: string;
    amount: number;
    color?: string;
    frequency?: string;
};

// ── Searchable dropdown ───────────────────────────────────────────────────────

function SearchableSelect({
    options,
    value,
    onChange,
    disabled,
}: {
    options: SavingsOption[];
    value: string;
    onChange: (key: string) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = options.find(o => o.key === value) ?? null;
    const useSearch = options.length > 3;

    const filtered = useSearch && query.trim()
        ? options.filter(o =>
            o.name.toLowerCase().includes(query.toLowerCase()) ||
            o.subtitle.toLowerCase().includes(query.toLowerCase()),
        )
        : options;

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        if (disabled) return;
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSelect = (key: string) => {
        onChange(key);
        setOpen(false);
        setQuery('');
    };

    // ── ≤3 items: native select ────────────────────────────────────────────
    if (!useSearch) {
        return (
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-brand-navy"
            >
                <option value="">— Choose savings —</option>
                {options.map(o => (
                    <option key={o.key} value={o.key}>
                        {o.name} · {o.subtitle}
                    </option>
                ))}
            </select>
        );
    }

    // ── >3 items: custom searchable dropdown ───────────────────────────────
    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className="w-full flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-left disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
                {selected ? (
                    <>
                        <span className="flex-1 font-medium text-brand-navy truncate">{selected.name}</span>
                        <span className="shrink-0 text-[10px] text-brand-gray truncate">{selected.subtitle}</span>
                    </>
                ) : (
                    <span className="flex-1 text-slate-400">— Choose savings —</span>
                )}
                <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                    {/* Search input */}
                    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                        <Search size={13} className="shrink-0 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search savings..."
                            className="flex-1 bg-transparent text-sm text-brand-navy placeholder:text-slate-400 focus:outline-none"
                        />
                    </div>

                    {/* List */}
                    <ul className="max-h-56 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-slate-400 text-center">No results</li>
                        ) : filtered.map(o => (
                            <li key={o.key}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(o.key)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors ${value === o.key ? 'bg-blue-50' : ''}`}
                                >
                                    <div
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                        style={{ backgroundColor: `${o.color ?? (o.type === 'scheme' ? '#10B981' : '#1D4ED8')}18` }}
                                    >
                                        {o.type === 'goal'
                                            ? <Target size={13} style={{ color: o.color ?? '#1D4ED8' }} />
                                            : <Calendar size={13} className="text-emerald-600" />
                                        }
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-brand-navy truncate">{o.name}</p>
                                        <p className="text-[10px] text-brand-gray truncate">{o.subtitle}</p>
                                    </div>
                                    {value === o.key && <CheckCircle2 size={13} className="shrink-0 text-brand-primary" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ── Main page content ─────────────────────────────────────────────────────────

type RawGoal   = {
    id: string;
    name: string;
    frequency: string;
    contribution_amount: number;
    minimum_amount?: number | null;
    status: string;
    festive_periods?: { color: string } | null;
};
type RawScheme = { id: string; name: string; frequency: string; minimum_amount: number; status: string };
type SavingsRaw = { goals: RawGoal[]; schemes: RawScheme[]; gated: boolean };

async function fetchSavingsRaw(): Promise<SavingsRaw> {
    const [goalsRes, schemesRes] = await Promise.all([
        fetch('/api/savings/goals'),
        fetch('/api/savings/schemes'),
    ]);
    if (goalsRes.status === 403) return { goals: [], schemes: [], gated: true };
    const goalsJson   = goalsRes.ok   ? await goalsRes.json()   : { data: [] };
    const schemesJson = schemesRes.ok ? await schemesRes.json() : { data: [] };
    return {
        goals:   Array.isArray(goalsJson.data)   ? goalsJson.data   : [],
        schemes: Array.isArray(schemesJson.data) ? schemesJson.data : [],
        gated: false,
    };
}

function PayPageContent() {
    const searchParams = useSearchParams();
    const prefillGoalId   = searchParams.get('goalId');
    const prefillSchemeId = searchParams.get('schemeId');

    const { showToast } = useToast();

    // Share the same cache key as the Savings page — instant load if user visited Savings first.
    const { data: raw, loading } = useData<SavingsRaw>('savings-data', fetchSavingsRaw);

    const options = useMemo<SavingsOption[]>(() => {
        if (!raw) return [];
        const goalOpts: SavingsOption[] = raw.goals
            .filter(g => g.status === 'active')
            .map(g => ({
                // Target min is at least NGN 500, unless admin set higher.
                // Keep prefill at contribution_amount, but enforce min at add/pay time.
                id: g.id, key: `goal::${g.id}`, type: 'goal' as const,
                name: g.name,
                subtitle: `${g.frequency} · min NGN ${Number(Math.max(500, Number(g.minimum_amount ?? 0))).toLocaleString('en-NG')}`,
                defaultAmount: g.contribution_amount,
                color: g.festive_periods?.color, frequency: g.frequency,
            }));
        const schemeOpts: SavingsOption[] = raw.schemes
            .filter(s => s.status === 'active')
            .map(s => ({
                id: s.id, key: `scheme::${s.id}`, type: 'scheme' as const,
                name: s.name,
                subtitle: `${s.frequency} savings · min NGN ${Number(s.minimum_amount).toLocaleString('en-NG')}`,
                defaultAmount: s.minimum_amount, frequency: s.frequency,
            }));
        return [...goalOpts, ...schemeOpts];
    }, [raw]);

    const [paying, setPaying] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);
    const [allocations, setAllocations] = useState<AllocationItem[]>([]);
    const [selectedKey, setSelectedKey] = useState('');
    const [customAmount, setCustomAmount] = useState('');

    // Pre-fill from URL once options are loaded
    useEffect(() => {
        if (!options.length) return;
        if (prefillGoalId) {
            const opt = options.find(o => o.type === 'goal' && o.id === prefillGoalId);
            if (opt) { setSelectedKey(opt.key); setCustomAmount(String(opt.defaultAmount)); }
        } else if (prefillSchemeId) {
            const opt = options.find(o => o.type === 'scheme' && o.id === prefillSchemeId);
            if (opt) { setSelectedKey(opt.key); setCustomAmount(String(opt.defaultAmount)); }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.length]);

    const handleSelectionChange = (key: string) => {
        setSelectedKey(key);
        const opt = options.find(o => o.key === key);
        if (opt) setCustomAmount(String(opt.defaultAmount));
        else setCustomAmount('');
    };

    const handleAdd = () => {
        const opt = options.find(o => o.key === selectedKey);
        if (!opt) { notifyWarning(showToast, 'Please select a savings target first.'); return; }
        const amount = Number(customAmount) || opt.defaultAmount;
        if (!amount) { notifyWarning(showToast, 'Please enter an amount.'); return; }
        if (opt.type === 'goal') {
            const rawGoal = raw?.goals.find(g => g.id === opt.id);
            const minGoalAmount = Math.max(500, Number(rawGoal?.minimum_amount ?? 0));
            if (amount < minGoalAmount) {
                notifyWarning(showToast, `Minimum for this target is NGN ${minGoalAmount.toLocaleString('en-NG')}.`);
                return;
            }
        }

        const allocationKey = `${selectedKey}::${Date.now()}::${Math.random().toString(36).slice(2, 6)}`;
        setAllocations(prev => [...prev, {
            key: allocationKey,
            type: opt.type,
            id: opt.id,
            label: opt.name,
            amount,
            color: opt.color,
            frequency: opt.frequency,
        }]);
        setSelectedKey('');
        setCustomAmount('');
    };

    const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);

    const handlePay = async () => {
        if (allocations.length === 0) {
            notifyWarning(showToast, 'Add at least one savings target to pay.');
            return;
        }
        setPaying(true);
        setPaymentStatus(null);
        try {
            const goalItems   = allocations.filter(a => a.type === 'goal');
            const schemeItems = allocations.filter(a => a.type === 'scheme');
            const errors: string[] = [];

            if (goalItems.length === 1) {
                const res = await fetch('/api/payments/individual-savings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ goalId: goalItems[0]!.id, amount: goalItems[0]!.amount }),
                });
                const json = await res.json();
                if (!res.ok) errors.push(json.error ?? 'Goal payment failed.');
            } else if (goalItems.length > 1) {
                const res = await fetch('/api/payments/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        allocations: goalItems.map(a => ({
                            targetType: 'individual_goal',
                            targetId: a.id,
                            amount: a.amount,
                        })),
                    }),
                });
                const json = await res.json();
                if (!res.ok) errors.push(json.error ?? 'Bulk goal payment failed.');
            }

            for (const item of schemeItems) {
                const res = await fetch('/api/payments/general-savings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ schemeId: item.id, amount: item.amount }),
                });
                const json = await res.json();
                if (!res.ok) errors.push(json.error ?? `Payment failed for "${item.label}".`);
            }

            if (errors.length > 0) {
                notifyError(showToast, new Error(errors[0]!), errors[0]!);
                setPaymentStatus('failed');
            } else {
                notifySuccess(showToast, 'Payment successful — savings updated.');
                setPaymentStatus('success');
                setAllocations([]);
            }
        } catch (err) {
            setPaymentStatus('failed');
            notifyError(showToast, err, 'Could not complete payment.');
        } finally {
            setPaying(false);
        }
    };

    const fmt = (v: number) => `NGN ${Number(v).toLocaleString('en-NG')}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-gray">
                <Loader2 size={16} className="animate-spin" /> Loading...
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto space-y-5">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy">
                <ArrowLeft size={14} /> Back
            </Link>

            {paymentStatus === 'success' && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={15} className="shrink-0" />
                    Payment successful — your savings have been updated.
                </div>
            )}
            {paymentStatus === 'failed' && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    Payment failed. Check your wallet balance and try again.
                </div>
            )}

            <div>
                <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2">
                    <CreditCard size={20} className="text-brand-primary" />
                    Make Payment
                </h1>
                <p className="text-xs text-brand-gray mt-0.5">Select savings, enter amount, and pay from wallet. Add the same target multiple times to pay ahead periods.</p>
            </div>

            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <h2 className="text-sm font-bold text-brand-navy">Step 1 — Select &amp; add</h2>

                {options.length === 0 ? (
                    <p className="text-xs text-brand-gray">
                        No active savings.{' '}
                        <Link href="/savings" className="font-semibold text-brand-primary underline">Create one →</Link>
                    </p>
                ) : (
                    <>
                        <SearchableSelect
                            options={options}
                            value={selectedKey}
                            onChange={handleSelectionChange}
                        />
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
                                disabled={!selectedKey}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-primary-hover disabled:opacity-50 transition-colors"
                            >
                                <Plus size={13} /> Add
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Step 2 */}
            {allocations.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                    <h2 className="text-sm font-bold text-brand-navy">Step 2 — Review &amp; pay</h2>

                    <div className="divide-y divide-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                        {allocations.map(a => (
                            <div key={a.key} className="flex items-center gap-3 px-3 py-3 bg-white hover:bg-slate-50">
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: `${a.color ?? (a.type === 'scheme' ? '#10B981' : '#1D4ED8')}20` }}
                                >
                                    {a.type === 'goal'
                                        ? <Target size={14} style={{ color: a.color ?? '#1D4ED8' }} />
                                        : <Calendar size={14} className="text-emerald-600" />
                                    }
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-brand-navy truncate">{a.label}</p>
                                    <p className="text-[10px] text-brand-gray capitalize">
                                        {a.type === 'goal' ? `Target · ${a.frequency}` : `General · ${a.frequency}`}
                                    </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                    <p className="text-sm font-bold text-brand-navy">{fmt(a.amount)}</p>
                                    <button
                                        onClick={() => setAllocations(al => al.filter(x => x.key !== a.key))}
                                        className="text-slate-300 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                        <span className="text-sm font-bold text-brand-navy">Total</span>
                        <span className="text-lg font-bold text-brand-navy">{fmt(totalAmount)}</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] text-blue-700">
                        <ShieldCheck size={12} className="shrink-0" />
                        Debited from wallet instantly. General savings are paid out on fixed platform dates.
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={paying}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
                    >
                        {paying
                            ? <><Loader2 size={15} className="animate-spin" /> Processing...</>
                            : <>Pay {fmt(totalAmount)} <ArrowRight size={15} /></>
                        }
                    </button>
                </div>
            )}

            {allocations.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center space-y-2">
                    <CreditCard size={20} className="mx-auto text-slate-300" />
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
