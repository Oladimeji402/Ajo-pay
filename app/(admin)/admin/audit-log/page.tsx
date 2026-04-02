'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Clock3, Download, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError } from '@/lib/toast';

type AuditRow = {
    id: string;
    admin_id: string;
    action: string;
    target_type: string;
    target_id: string;
    before_val: Record<string, unknown>;
    after_val: Record<string, unknown>;
    metadata: Record<string, unknown>;
    created_at: string;
};

const ACTION_FILTERS = ['all', 'user_updated', 'payout_updated', 'payout_approved', 'group_updated', 'group_member_removed'];
const TARGET_FILTERS = ['all', 'user', 'payout', 'group', 'group_member'];

const ACTION_META: Record<string, { label: string; tone: string }> = {
    user_updated: { label: 'User Updated', tone: 'bg-blue-100 text-blue-700' },
    payout_updated: { label: 'Payout Updated', tone: 'bg-amber-100 text-amber-700' },
    payout_approved: { label: 'Payout Approved', tone: 'bg-emerald-100 text-emerald-700' },
    group_updated: { label: 'Group Updated', tone: 'bg-indigo-100 text-indigo-700' },
    group_member_removed: { label: 'Member Removed', tone: 'bg-rose-100 text-rose-700' },
};

const controlClassName = 'h-11 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-sm text-brand-navy shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:shadow focus:border-brand-primary/60 focus:outline-none focus:ring-4 focus:ring-brand-primary/15';
const subtleButtonClassName = 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-brand-navy shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow active:translate-y-0';

function AuditLogSkeleton() {
    return (
        <div className="space-y-5 animate-pulse">
            <section className="rounded-2xl border border-slate-100 bg-white p-4 md:p-5 space-y-3">
                <div className="h-3 w-20 rounded bg-slate-200" />
                <div className="h-7 w-44 rounded bg-slate-200" />
                <div className="h-4 w-80 rounded bg-slate-200" />
                <div className="grid gap-2 md:grid-cols-3">
                    {Array.from({ length: 6 }, (_, idx) => (
                        <div key={idx} className="h-10 rounded-lg bg-slate-100" />
                    ))}
                </div>
                <div className="h-9 w-24 rounded-lg bg-slate-200" />
            </section>
            <section className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }, (_, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 h-20" />
                ))}
            </section>
            <section className="space-y-2">
                {Array.from({ length: 4 }, (_, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 h-24" />
                ))}
            </section>
        </div>
    );
}

export default function AdminAuditLogPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [targetFilter, setTargetFilter] = useState('all');
    const [adminFilter, setAdminFilter] = useState('');
    const [targetIdFilter, setTargetIdFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [records, setRecords] = useState<AuditRow[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<AuditRow | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.set('page', '1');
            params.set('pageSize', '100');
            if (actionFilter !== 'all') params.set('action', actionFilter);
            if (targetFilter !== 'all') params.set('targetType', targetFilter);
            if (adminFilter.trim()) params.set('adminId', adminFilter.trim());
            if (targetIdFilter.trim()) params.set('targetId', targetIdFilter.trim());
            if (fromDate) params.set('from', fromDate);
            if (toDate) params.set('to', toDate);

            const response = await fetch(`/api/admin/audit-log?${params.toString()}`, { cache: 'no-store' });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'Unable to load audit log.');
            }

            setRecords(Array.isArray(payload.data) ? payload.data : []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to load audit log.';
            setError(message);
            notifyError(showToast, err, message);
        } finally {
            setLoading(false);
        }
    }, [actionFilter, adminFilter, fromDate, showToast, targetFilter, targetIdFilter, toDate]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const exportCsv = () => {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('pageSize', '500');
        params.set('format', 'csv');
        if (actionFilter !== 'all') params.set('action', actionFilter);
        if (targetFilter !== 'all') params.set('targetType', targetFilter);
        if (adminFilter.trim()) params.set('adminId', adminFilter.trim());
        if (targetIdFilter.trim()) params.set('targetId', targetIdFilter.trim());
        if (fromDate) params.set('from', fromDate);
        if (toDate) params.set('to', toDate);

        window.open(`/api/admin/audit-log?${params.toString()}`, '_blank', 'noopener,noreferrer');
    };

    const groupedSummary = useMemo(() => {
        const counts = new Map<string, number>();
        for (const record of records) {
            counts.set(record.action, (counts.get(record.action) ?? 0) + 1);
        }
        return Array.from(counts.entries());
    }, [records]);

    const uniqueAdmins = useMemo(() => new Set(records.map((record) => record.admin_id)).size, [records]);
    const uniqueTargets = useMemo(() => new Set(records.map((record) => `${record.target_type}:${record.target_id}`)).size, [records]);

    const clearFilters = () => {
        setActionFilter('all');
        setTargetFilter('all');
        setAdminFilter('');
        setTargetIdFilter('');
        setFromDate('');
        setToDate('');
    };

    if (loading) {
        return <AuditLogSkeleton />;
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-brand-navy">Audit Log</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={exportCsv}
                        className={subtleButtonClassName}
                    >
                        <Download size={13} />
                        Export CSV
                    </button>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className={subtleButtonClassName}
                    >
                        <RotateCcw size={13} />
                        Reset filters
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-3">
                <div className="grid gap-2 md:grid-cols-3">
                    <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={controlClassName}>
                        {ACTION_FILTERS.map((value) => (
                            <option key={value} value={value}>{value === 'all' ? 'All actions' : value}</option>
                        ))}
                    </select>
                    <select value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)} className={controlClassName}>
                        {TARGET_FILTERS.map((value) => (
                            <option key={value} value={value}>{value === 'all' ? 'All targets' : value}</option>
                        ))}
                    </select>
                    <input
                        value={adminFilter}
                        onChange={(e) => setAdminFilter(e.target.value)}
                        placeholder="Filter by admin ID"
                        className={controlClassName}
                    />
                    <input
                        value={targetIdFilter}
                        onChange={(e) => setTargetIdFilter(e.target.value)}
                        placeholder="Filter by target ID"
                        className={controlClassName}
                    />
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className={controlClassName}
                    />
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className={controlClassName}
                    />
                </div>
                {groupedSummary.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {groupedSummary.map(([action, count]) => (
                            <span key={action} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-brand-navy">
                                {(ACTION_META[action]?.label || action)}: {count}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <section className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-xs text-brand-gray">Events Loaded</p>
                    <p className="mt-1 text-xl font-bold text-brand-navy">{records.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-xs text-brand-gray">Admins Involved</p>
                    <p className="mt-1 text-xl font-bold text-brand-navy">{uniqueAdmins}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-xs text-brand-gray">Distinct Targets</p>
                    <p className="mt-1 text-xl font-bold text-brand-navy">{uniqueTargets}</p>
                </div>
            </section>

            {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <section className="space-y-3">
                {records.length === 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-brand-gray">No audit entries found for the current filters.</div>
                ) : records.map((record) => (
                    <article key={record.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${ACTION_META[record.action]?.tone || 'bg-slate-100 text-slate-700'}`}>
                                        {ACTION_META[record.action]?.label || record.action}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                                        {record.target_type}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-brand-gray break-all">Target: {record.target_id}</p>
                                <p className="mt-1 text-xs text-brand-gray break-all">Admin: {record.admin_id}</p>
                            </div>

                            <div className="text-right">
                                <p className="inline-flex items-center gap-1 text-xs text-brand-gray">
                                    <Clock3 size={12} /> {new Date(record.created_at).toLocaleString('en-NG')}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRecord(record)}
                                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-navy transition hover:border-brand-primary/30 hover:bg-brand-primary/5"
                                >
                                    View details <ChevronRight size={13} />
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </section>

            {selectedRecord && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
                    <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                    <ShieldCheck size={12} /> {ACTION_META[selectedRecord.action]?.label || selectedRecord.action}
                                </p>
                                <h2 className="mt-2 text-xl font-semibold text-brand-navy">Audit entry details</h2>
                                <p className="mt-1 text-xs text-brand-gray">{new Date(selectedRecord.created_at).toLocaleString('en-NG')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRecord(null)}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                                <p className="font-semibold text-brand-navy">Admin ID</p>
                                <p className="mt-1 break-all">{selectedRecord.admin_id}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                                <p className="font-semibold text-brand-navy">Target</p>
                                <p className="mt-1 break-all">{selectedRecord.target_type} / {selectedRecord.target_id}</p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-gray">Before</p>
                                <pre className="mt-1 max-h-64 overflow-auto text-[11px] text-brand-navy">{JSON.stringify(selectedRecord.before_val ?? {}, null, 2)}</pre>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-gray">After</p>
                                <pre className="mt-1 max-h-64 overflow-auto text-[11px] text-brand-navy">{JSON.stringify(selectedRecord.after_val ?? {}, null, 2)}</pre>
                            </div>
                        </div>

                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-gray">Metadata</p>
                            <pre className="mt-1 max-h-48 overflow-auto text-[11px] text-brand-navy">{JSON.stringify(selectedRecord.metadata ?? {}, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
