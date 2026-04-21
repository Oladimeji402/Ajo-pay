'use client';

import React from 'react';
import { CheckCircle2, Circle, XCircle, Clock } from 'lucide-react';
import { generatePassbookSlots, PassbookFrequency } from '@/lib/ajo-schedule';

export type PassbookContribution = {
    id: string;
    period_index: number;
    period_label: string;
    period_date: string;
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'abandoned';
    paid_at?: string | null;
};

type Props = {
    startDate: string;
    endDate: string;
    frequency: PassbookFrequency;
    contributions: PassbookContribution[];
    contributionAmount: number;
    /** Called when user clicks Pay on a pending slot */
    onPay?: (slot: { periodIndex: number; periodLabel: string; periodDate: string }) => void;
};

const statusIcon = {
    success: <CheckCircle2 size={14} className="text-emerald-500" />,
    pending: <Clock size={14} className="text-amber-400" />,
    failed: <XCircle size={14} className="text-red-400" />,
    abandoned: <XCircle size={14} className="text-slate-300" />,
};

const statusStyle = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    failed: 'bg-red-50 text-red-600 border-red-100',
    abandoned: 'bg-slate-50 text-slate-400 border-slate-100',
};

export function PassbookTable({ startDate, endDate, frequency, contributions, contributionAmount, onPay }: Props) {
    const slots = generatePassbookSlots(startDate, endDate, frequency);

    const byIndex = new Map(contributions.map(c => [c.period_index, c]));

    const paid = contributions.filter(c => c.status === 'success').length;
    const total = slots.length;
    const progressPct = total > 0 ? Math.round((paid / total) * 100) : 0;

    const formatCurrency = (v: number) =>
        `₦${Number(v).toLocaleString('en-NG')}`;

    return (
        <div className="space-y-4">
            {/* Progress header */}
            <div className="flex items-center justify-between text-xs text-brand-gray">
                <span>{paid}/{total} slots paid · {progressPct}% complete</span>
                <span>{formatCurrency(paid * contributionAmount)} of {formatCurrency(total * contributionAmount)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="py-2.5 px-4 text-left text-[10px] font-bold text-brand-gray uppercase tracking-wider w-8">#</th>
                            <th className="py-2.5 px-4 text-left text-[10px] font-bold text-brand-gray uppercase tracking-wider">Period</th>
                            <th className="py-2.5 px-4 text-left text-[10px] font-bold text-brand-gray uppercase tracking-wider">Amount</th>
                            <th className="py-2.5 px-4 text-left text-[10px] font-bold text-brand-gray uppercase tracking-wider">Status</th>
                            {onPay && (
                                <th className="py-2.5 px-4 text-right text-[10px] font-bold text-brand-gray uppercase tracking-wider">Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {slots.map(slot => {
                            const entry = byIndex.get(slot.periodIndex);
                            const status = entry?.status ?? 'pending';

                            return (
                                <tr key={slot.periodIndex} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="py-3 px-4 text-[11px] text-slate-400">{slot.periodIndex + 1}</td>
                                    <td className="py-3 px-4">
                                        <div>
                                            <p className="text-sm font-semibold text-brand-navy">{slot.periodLabel}</p>
                                            <p className="text-[10px] text-brand-gray">{slot.periodDate}</p>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <p className={`text-sm font-bold ${status === 'success' ? 'text-emerald-700' : 'text-slate-400'}`}>
                                            {formatCurrency(entry?.amount ?? contributionAmount)}
                                        </p>
                                        {entry?.paid_at && (
                                            <p className="text-[10px] text-brand-gray">{new Date(entry.paid_at).toLocaleDateString('en-NG')}</p>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusStyle[status]}`}>
                                            {statusIcon[status]}
                                            {status === 'success' ? 'Paid' : status === 'pending' ? 'Pending' : status === 'failed' ? 'Failed' : 'Abandoned'}
                                        </span>
                                    </td>
                                    {onPay && (
                                        <td className="py-3 px-4 text-right">
                                            {status !== 'success' && (
                                                <button
                                                    onClick={() => onPay(slot)}
                                                    className="rounded-lg border border-brand-primary px-2.5 py-1 text-[10px] font-bold text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
                                                >
                                                    Pay
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


// ── Group passbook variant (round-based) ─────────────────────────────────────

export type GroupPassbookContribution = {
    id: string;
    cycle_number: number;
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'abandoned';
    paid_at?: string | null;
    paystack_reference?: string | null;
};

type GroupPassbookTableProps = {
    totalCycles: number;
    contributions: GroupPassbookContribution[];
    contributionAmount: number;
    groupName: string;
};

export function GroupPassbookTable({ totalCycles, contributions, contributionAmount, groupName }: GroupPassbookTableProps) {
    const byRound = new Map(contributions.map(c => [c.cycle_number, c]));
    const paid = contributions.filter(c => c.status === 'success').length;
    const progressPct = totalCycles > 0 ? Math.round((paid / totalCycles) * 100) : 0;

    const formatCurrency = (v: number) => `₦${Number(v).toLocaleString('en-NG')}`;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-brand-gray">
                <span>{paid}/{totalCycles} rounds paid · {progressPct}% complete</span>
                <span>{formatCurrency(paid * contributionAmount)} contributed to {groupName}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-brand-primary transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="py-2.5 px-4 text-left text-[10px] font-bold text-brand-gray uppercase tracking-wider">Round</th>
                            <th className="py-2.5 px-4 text-left text-[10px] font-bold text-brand-gray uppercase tracking-wider">Amount</th>
                            <th className="py-2.5 px-4 text-left text-[10px] font-bold text-brand-gray uppercase tracking-wider">Status</th>
                            <th className="py-2.5 px-4 text-left text-[10px] font-bold text-brand-gray uppercase tracking-wider">Date Paid</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {Array.from({ length: totalCycles }, (_, i) => i + 1).map(round => {
                            const entry = byRound.get(round);
                            const status = entry?.status ?? 'pending';

                            return (
                                <tr key={round} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="py-3 px-4">
                                        <p className="text-sm font-semibold text-brand-navy">Round {round}</p>
                                    </td>
                                    <td className="py-3 px-4">
                                        <p className={`text-sm font-bold ${status === 'success' ? 'text-emerald-700' : 'text-slate-400'}`}>
                                            {formatCurrency(entry?.amount ?? contributionAmount)}
                                        </p>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusStyle[status]}`}>
                                            {statusIcon[status]}
                                            {status === 'success' ? 'Paid' : status === 'pending' ? 'Pending' : status === 'failed' ? 'Failed' : 'Abandoned'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-[11px] text-brand-gray">
                                        {entry?.paid_at ? new Date(entry.paid_at).toLocaleDateString('en-NG') : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
